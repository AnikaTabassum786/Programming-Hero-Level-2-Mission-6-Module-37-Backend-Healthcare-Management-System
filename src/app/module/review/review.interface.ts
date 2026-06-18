
//This is the payload for creating a new review.
export interface ICreateReviewPayload {
    appointmentId: string;
    rating: number;
    comment: string;
}

////This is the payload for updating a new review.
export interface IUpdateReviewPayload {
    rating: number;
    comment: string;
}