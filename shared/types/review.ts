export interface ReviewItem {
  concept_id: string;
  concept_type: "vocabulary" | "grammar";
  content_url: string;
  ease_factor: number;
  interval_days: number;
  review_count: number;
}

export interface ReviewNextResponse {
  items: ReviewItem[];
  total_due: number;
}

export interface ReviewSubmitRequest {
  concept_id: string;
  quality: number;
}

export interface ReviewSubmitResponse {
  new_interval_days: number;
  new_ease_factor: number;
  next_review_at: string;
}
