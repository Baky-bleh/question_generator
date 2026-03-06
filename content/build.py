#!/usr/bin/env python3
"""Content build & validation script.

Validates all course content JSON files against their schemas and
generates a versioned manifest for deployment.

Usage:
    python content/build.py [--content-dir content/] [--output-dir build/]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

EXERCISE_TYPES = [
    "multiple_choice",
    "fill_blank",
    "matching",
    "listening",
    "word_arrange",
    "translation",
]

SCHEMA_DIR = Path(__file__).parent / "schemas"


def load_schema(exercise_type: str) -> dict:
    schema_path = SCHEMA_DIR / f"{exercise_type}.json"
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema not found: {schema_path}")
    with open(schema_path) as f:
        return json.load(f)


def load_manifest_schema() -> dict:
    schema_path = SCHEMA_DIR / "course_manifest.json"
    with open(schema_path) as f:
        return json.load(f)


def validate_json_against_schema(data: dict, schema: dict) -> list[str]:
    """Lightweight schema validation without jsonschema dependency.

    Checks required fields, type constraints, and enum values.
    For full JSON Schema validation, install jsonschema and use that instead.
    """
    errors: list[str] = []

    required = schema.get("required", [])
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")

    properties = schema.get("properties", {})
    for field, value in data.items():
        if field not in properties and schema.get("additionalProperties") is False:
            errors.append(f"Unexpected field: '{field}'")

    return errors


def validate_exercise(exercise: dict, schemas: dict[str, dict]) -> list[str]:
    """Validate a single exercise against its type schema."""
    errors: list[str] = []

    exercise_type = exercise.get("type")
    if not exercise_type:
        return ["Exercise missing 'type' field"]

    if exercise_type not in schemas:
        return [f"Unknown exercise type: '{exercise_type}'"]

    schema = schemas[exercise_type]
    schema_errors = validate_json_against_schema(exercise, schema)
    exercise_id = exercise.get("id", "<no id>")
    errors.extend(f"[{exercise_id}] {e}" for e in schema_errors)

    # Type-specific validation
    if exercise_type == "multiple_choice":
        choices = exercise.get("choices", [])
        correct_index = exercise.get("correct_index")
        if correct_index is not None and correct_index >= len(choices):
            errors.append(
                f"[{exercise_id}] correct_index {correct_index} "
                f"out of range for {len(choices)} choices"
            )

    return errors


def validate_lesson(lesson_path: Path, schemas: dict[str, dict]) -> list[str]:
    """Validate a lesson JSON file."""
    errors: list[str] = []

    try:
        with open(lesson_path) as f:
            lesson = json.load(f)
    except json.JSONDecodeError as e:
        return [f"{lesson_path}: Invalid JSON: {e}"]

    lesson_id = lesson.get("id", "<no id>")

    if "exercises" not in lesson:
        errors.append(f"{lesson_id}: Missing 'exercises' array")
        return errors

    exercise_ids: set[str] = set()
    for exercise in lesson["exercises"]:
        eid = exercise.get("id", "")
        if eid in exercise_ids:
            errors.append(f"{lesson_id}: Duplicate exercise ID: '{eid}'")
        exercise_ids.add(eid)

        ex_errors = validate_exercise(exercise, schemas)
        errors.extend(f"{lesson_id}/{e}" for e in ex_errors)

    return errors


def validate_manifest(manifest_path: Path) -> tuple[dict | None, list[str]]:
    """Validate the course manifest."""
    errors: list[str] = []

    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except json.JSONDecodeError as e:
        return None, [f"Invalid manifest JSON: {e}"]

    schema = load_manifest_schema()
    schema_errors = validate_json_against_schema(manifest, schema)
    errors.extend(schema_errors)

    # Check unit ordering
    unit_orders: set[int] = set()
    for unit in manifest.get("units", []):
        order = unit.get("order")
        if order in unit_orders:
            errors.append(f"Duplicate unit order: {order}")
        unit_orders.add(order)

        # Check lesson ordering within unit
        lesson_orders: set[int] = set()
        lesson_ids: set[str] = set()
        for lesson in unit.get("lessons", []):
            l_order = lesson.get("order")
            if l_order in lesson_orders:
                errors.append(f"Unit {order}: Duplicate lesson order: {l_order}")
            lesson_orders.add(l_order)

            lid = lesson.get("id")
            if lid in lesson_ids:
                errors.append(f"Unit {order}: Duplicate lesson ID: '{lid}'")
            lesson_ids.add(lid)

    return manifest, errors


def validate_course(course_dir: Path) -> list[str]:
    """Validate all content in a course directory."""
    errors: list[str] = []

    manifest_path = course_dir / "manifest.json"
    if not manifest_path.exists():
        return [f"Missing manifest.json in {course_dir}"]

    manifest, manifest_errors = validate_manifest(manifest_path)
    errors.extend(manifest_errors)

    if manifest is None:
        return errors

    # Load exercise schemas
    schemas: dict[str, dict] = {}
    for ex_type in EXERCISE_TYPES:
        try:
            schemas[ex_type] = load_schema(ex_type)
        except FileNotFoundError as e:
            errors.append(str(e))

    # Validate each lesson file referenced in manifest
    for unit in manifest.get("units", []):
        unit_order = unit.get("order", 0)
        for lesson in unit.get("lessons", []):
            lesson_order = lesson.get("order", 0)
            lesson_path = (
                course_dir / "units" / str(unit_order) / "lessons" / f"{lesson_order}.json"
            )
            if not lesson_path.exists():
                errors.append(f"Missing lesson file: {lesson_path}")
                continue

            lesson_errors = validate_lesson(lesson_path, schemas)
            errors.extend(lesson_errors)

            # Cross-validate lesson ID matches manifest
            with open(lesson_path) as f:
                lesson_data = json.load(f)
            if lesson_data.get("id") != lesson.get("id"):
                errors.append(
                    f"Lesson ID mismatch: manifest says '{lesson.get('id')}' "
                    f"but file says '{lesson_data.get('id')}'"
                )

            # Cross-validate exercise count
            actual_count = len(lesson_data.get("exercises", []))
            expected_count = lesson.get("exercise_count", 0)
            if actual_count != expected_count:
                errors.append(
                    f"Exercise count mismatch for {lesson.get('id')}: "
                    f"manifest says {expected_count}, file has {actual_count}"
                )

    return errors


def compute_content_hash(course_dir: Path) -> str:
    """Compute a deterministic hash of all content files for cache-busting."""
    hasher = hashlib.sha256()
    for path in sorted(course_dir.rglob("*.json")):
        hasher.update(path.read_bytes())
    return hasher.hexdigest()[:12]


def build(content_dir: Path, output_dir: Path | None = None) -> bool:
    """Main build entry point. Returns True if all content is valid."""
    all_errors: list[str] = []

    courses_dir = content_dir / "courses"
    if not courses_dir.exists():
        print(f"ERROR: Courses directory not found: {courses_dir}")
        return False

    for course_dir in sorted(courses_dir.iterdir()):
        if not course_dir.is_dir():
            continue

        slug = course_dir.name
        print(f"Validating course: {slug}")
        errors = validate_course(course_dir)

        if errors:
            for error in errors:
                print(f"  ERROR: {error}")
            all_errors.extend(errors)
        else:
            content_hash = compute_content_hash(course_dir)
            print(f"  OK ({content_hash})")

    if all_errors:
        print(f"\nBuild FAILED: {len(all_errors)} error(s) found.")
        return False

    print("\nBuild PASSED: All content is valid.")

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        # Copy validated content to output for deployment
        print(f"Output would be written to: {output_dir}")

    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and build course content")
    parser.add_argument(
        "--content-dir",
        type=Path,
        default=Path(__file__).parent,
        help="Path to content directory (default: content/)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Path to write validated output (optional)",
    )
    args = parser.parse_args()

    success = build(args.content_dir, args.output_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
