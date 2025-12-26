import Sentiment from "sentiment";
import { removeStopwords } from "stopword";
//import ngram from "ngram";
import { Review } from "./review";

const sentiment = new Sentiment();

// Browser-compatible tokenizer (simple word split)
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length > 0);
}

// Simple Porter stemmer implementation (basic version)
function stem(word: string): string {
  // Basic stemming - remove common suffixes
  if (word.length < 3) return word;
  
  // Remove plural 's'
  if (word.endsWith('s') && word.length > 3) {
    word = word.slice(0, -1);
  }
  
  // Remove common suffixes
//   const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment'];
//   for (const suffix of suffixes) {
//     if (word.endsWith(suffix) && word.length > suffix.length + 2) {
//       word = word.slice(0, -suffix.length);
//       break;
//     }
//   }
  
  return word;
}


export interface ReviewAnalyticsResult {
  summary: {
    totalReviews: number;
    avgRating: number;
    avgSentiment: number;
  };
  sentimentBuckets: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonWords: {
    positive: Record<string, number>;
    negative: Record<string, number>;
  };
  exclusiveWords: {
    fiveStarOnly: Record<string, number>;
    oneStarOnly: Record<string, number>;
  };
//   commonPhrases: {
//     positive: Record<string, number>;
//     negative: Record<string, number>;
//   };
}

/* -----------------------------
   Helpers
----------------------------- */

function preprocess(text: string): string[] {
  const tokens = tokenize(text);
  return removeStopwords(tokens).map((t: string) => stem(t));
}

function addFreq(map: Record<string, number>, items: string[]) {
  for (const item of items) {
    map[item] = (map[item] || 0) + 1;
  }
}

/* -----------------------------
   Main Analysis Function
----------------------------- */

export function analyseReviews(reviews: Review[]): ReviewAnalyticsResult {
  const freqPositive: Record<string, number> = {};
  const freqNegative: Record<string, number> = {};
  const freq5Star: Record<string, number> = {};
  const freq1Star: Record<string, number> = {};

  //const phrasePositive: Record<string, number> = {};
  //const phraseNegative: Record<string, number> = {};

  let totalSentiment = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  reviews.forEach(review => {
    const score = sentiment.analyze(review.Text).score;
    totalSentiment += score;

    if (score > 0) positiveCount++;
    else if (score < 0) negativeCount++;
    else neutralCount++;

    const tokens = preprocess(review.Text);

    if (review.Rating >= 4) addFreq(freqPositive, tokens);
    if (review.Rating <= 2) addFreq(freqNegative, tokens);
    if (review.Rating === 5) addFreq(freq5Star, tokens);
    if (review.Rating === 1) addFreq(freq1Star, tokens);



    // Phrase extraction (bi-grams)
    //const phrases = ngram.bigram(tokens).map((p: string[]) => p.join(" "));
    //if (review.rating >= 4) addFreq(phrasePositive, phrases);
    //if (review.rating <= 2) addFreq(phraseNegative, phrases);
  });

  // Exclusive word logic
  const fiveStarOnly: Record<string, number> = {};
  const oneStarOnly: Record<string, number> = {};

  Object.entries(freq5Star).forEach(([word, count]) => {
    if (!freq1Star[word]) fiveStarOnly[word] = count;
  });

  Object.entries(freq1Star).forEach(([word, count]) => {
    if (!freq5Star[word]) oneStarOnly[word] = count;
  });

  for (const positiveWord of Object.keys(freqPositive)) {
    if (freqNegative[positiveWord]) {
        freqNegative[positiveWord] = 0;
        freqPositive[positiveWord] = 0;
    }
  }
  for (const negativeWord of Object.keys(freqNegative)) {
    if (freqPositive[negativeWord]) {
        freqPositive[negativeWord] = 0;
        freqNegative[negativeWord] = 0;
    }
  }

  return {
    summary: {
      totalReviews: reviews.length,
      avgRating:
        reviews.reduce((a, b) => a + b.Rating, 0) / reviews.length,
      avgSentiment: totalSentiment / reviews.length
    },
    sentimentBuckets: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount
    },
    commonWords: {
      positive: freqPositive,
      negative: freqNegative
    },
    exclusiveWords: {
      fiveStarOnly,
      oneStarOnly
    }
    // commonPhrases: {
    //   positive: phrasePositive,
    //   negative: phraseNegative
    // }
  };
}
