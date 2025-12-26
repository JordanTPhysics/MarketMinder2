import { ReviewAnalyticsResult, analyseReviews } from "../lib/reviewAnalytics";
import { Review } from "../lib/review";
import Panel from "./ui/Panel";


export function ReviewSummary({ reviews, userBusinessName }: { reviews: Review[], userBusinessName: string }) {
    const reviewAnalytics = analyseReviews(reviews);
    return (
        <div className="flex flex-col md:flex-row lg:flex-row w-full mx-auto my-2 border-2 border-neon-purple rounded-md p-2 bg-foreground">
            <div className="flex flex-col gap-2 border-2 border-neon-blue rounded-md p-2 mx-auto bg-foreground-secondary w-1/4">
                <h2 className="text-2xl font-bold text-text mb-4 text-left border-b-2 pb-2">Summary</h2>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Total Reviews:</span>
                    <span className="italic text-lg">{reviewAnalytics.summary.totalReviews}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Average Rating:</span>
                    <span className="italic text-lg">{reviewAnalytics.summary.avgRating.toFixed(2)}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Average Sentiment:</span>
                    <span className="italic text-lg">{reviewAnalytics.summary.avgSentiment.toFixed(2)}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Positive Reviews:</span>
                    <span className="italic text-lg">{reviewAnalytics.sentimentBuckets.positive}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Negative Reviews:</span>
                    <span className="italic text-lg">{reviewAnalytics.sentimentBuckets.negative}</span>
                </div>
                <div className="flex flex-row justify-between">
                    <span className="text-xl font-bold">Neutral Reviews:</span>
                    <span className="italic text-lg">{reviewAnalytics.sentimentBuckets.neutral}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 border-2 border-neon-blue rounded-md p-2 mx-auto bg-foreground-secondary w-3/4">
                <h2 className="text-2xl font-bold text-text mb-4 text-left border-b-2 pb-2">Common Words</h2>
                <div className="flex flex-col gap-2">
                    <div>
                        <span className="text-xl font-bold">Positive Words:</span>
                        <div className="italic text-lg mt-1">
                            {Object.entries(reviewAnalytics.commonWords.positive)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 10)
                                .map(([word, count]) => `${word} (${count})`)
                                .join(', ')}
                        </div>
                    </div>
                    <div>
                        <span className="text-xl font-bold">Negative Words:</span>
                        <div className="italic text-lg mt-1">
                            {Object.entries(reviewAnalytics.commonWords.negative)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 10)
                                .map(([word, count]) => `${word} (${count})`)
                                .join(', ')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}