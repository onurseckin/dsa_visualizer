# Domain 03: Probability and Statistics

## Topic 09: Covariance & Correlation

### Part A: Algorithmic Foundations
1. [Implement Rand10() Using Rand7()](https://leetcode.com/problems/implement-rand10-using-rand7/)
2. [Maximum Subarray Sum with One Deletion](https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/)
3. [Random Pick with Weight](https://leetcode.com/problems/random-pick-with-weight/)
4. [Linked List Random Node](https://leetcode.com/problems/linked-list-random-node/)

### Part B: Mathematical Proofs
1. Prove that correlation coefficient is between -1 and 1.
2. Prove the linearity of expectation: E[X+Y] = E[X] + E[Y].
3. Prove that covariance is symmetric and bilinear.

### Part C: ML Systems Questions
1. How do you efficiently update the covariance matrix for a streaming dataset?
2. How does high feature correlation affect the condition number of the design matrix in OLS?
3. What are the memory and computational tradeoffs of computing a full correlation matrix for a billion-scale embedding matrix?

### Part D: Edge Cases / Stress Tests
1. X and Y are completely independent but non-linear (e.g. Y = X^2 where X is symmetric around 0) - what is the covariance?
2. Constant variables where variance is 0 (divide by zero issue for correlation).
3. Precision loss when calculating sample variance with large floats.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-09`
```python
def calculate_covariance(x, y):
    """
    Calculates the sample covariance of two lists x and y.
    """
    if len(x) != len(y) or len(x) <= 1:
        raise ValueError("x and y must have same length > 1")
    
    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    
    covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)
    return covariance
```

## Topic 10: Bayesian Inference

### Part A: Algorithmic Foundations
1. [Probability of a Two Boxes Having The Same Number of Distinct Balls](https://leetcode.com/problems/probability-of-a-two-boxes-having-the-same-number-of-distinct-balls/)
2. [New 21 Game](https://leetcode.com/problems/new-21-game/)
3. [Soup Servings](https://leetcode.com/problems/soup-servings/)
4. [Knight Probability in Chessboard](https://leetcode.com/problems/knight-probability-in-chessboard/)

### Part B: Mathematical Proofs
1. Derive Bayes' theorem from conditional probability definition.
2. Prove that the posterior is proportional to the likelihood times the prior.
3. Show that Gaussian Naive Bayes provides a linear decision boundary if class variances are equal.

### Part C: ML Systems Questions
1. In a Naive Bayes spam filter, how do you handle out-of-vocabulary words in production?
2. Why do we compute log probabilities instead of raw probabilities?
3. How do you implement Bayesian updating for CTR (click-through rate) prediction at scale?

### Part D: Edge Cases / Stress Tests
1. Handling zero probability for a feature given a class (requires Laplace smoothing).
2. Extreme prior imbalance leading to one class dominating completely regardless of likelihood.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-10`
```python
import math

def naive_bayes_predict_log_proba(class_priors, feature_probs, sample):
    """
    Predicts the log probability for each class given a sample.
    
    class_priors: dict mapping class -> prior probability
    feature_probs: dict mapping class -> dict of feature -> probability
    sample: list of features
    
    Returns dict mapping class -> unnormalized log posterior
    """
    log_posteriors = {}
    for c, prior in class_priors.items():
        if prior <= 0:
            log_posteriors[c] = float('-inf')
            continue
        
        log_prob = math.log(prior)
        for feature in sample:
            prob = feature_probs.get(c, {}).get(feature, 1e-9) # simple smoothing
            log_prob += math.log(prob)
        log_posteriors[c] = log_prob
        
    return log_posteriors
```

## Topic 11: Sampling & Bootstrap

### Part A: Algorithmic Foundations
1. [Linked List Random Node](https://leetcode.com/problems/linked-list-random-node/)
2. [Random Pick Index](https://leetcode.com/problems/random-pick-index/)
3. [Generate Random Point in a Circle](https://leetcode.com/problems/generate-random-point-in-a-circle/)

### Part B: Mathematical Proofs
1. Prove that the probability of a specific item NOT being chosen in a bootstrap sample of size N approaches 1/e as N goes to infinity.
2. Prove the unbiasedness of reservoir sampling.

### Part C: ML Systems Questions
1. How do you implement distributed reservoir sampling across multiple nodes?
2. In random forest training, how does bootstrapping help reduce model variance?
3. How do you ensure reproducibility when using stochastic sampling methods in production ML pipelines?

### Part D: Edge Cases / Stress Tests
1. Bootstrapping a dataset with highly imbalanced classes without stratification.
2. Confidence interval calculation when the metric has extremely high variance.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-11`
```python
import random

def bootstrap_confidence_interval(data, num_bootstraps, confidence_level):
    """
    Calculates the bootstrap confidence interval for the mean.
    """
    if not data:
        raise ValueError("Data cannot be empty")
        
    n = len(data)
    means = []
    
    for _ in range(num_bootstraps):
        sample = [random.choice(data) for _ in range(n)]
        means.append(sum(sample) / n)
        
    means.sort()
    
    alpha = 1.0 - confidence_level
    lower_idx = int(num_bootstraps * (alpha / 2))
    upper_idx = int(num_bootstraps * (1 - alpha / 2))
    
    return means[lower_idx], means[min(upper_idx, num_bootstraps - 1)]
```

## Topic 12: Distributions & LLM Sampling

### Part A: Algorithmic Foundations
1. [Design an ATM Machine](https://leetcode.com/problems/design-an-atm-machine/)
2. [Shuffle an Array](https://leetcode.com/problems/shuffle-an-array/)
3. [Random Point in Non-overlapping Rectangles](https://leetcode.com/problems/random-point-in-non-overlapping-rectangles/)

### Part B: Mathematical Proofs
1. Show that applying temperature T to softmax changes the entropy of the resulting distribution.
2. Prove that top-p sampling correctly truncates the tail of a probability distribution while maintaining valid probabilities after rescaling.

### Part C: ML Systems Questions
1. How is top-p and top-k filtering implemented efficiently on GPUs during LLM generation?
2. What happens to the generation quality if temperature is set to 0 vs 2.0?
3. How do you handle sampling bottlenecks when serving large vocabulary language models?

### Part D: Edge Cases / Stress Tests
1. p is 0.0 or 1.0.
2. Multiple tokens having the exact same probability bridging the top-p threshold.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-12`
```python
def top_p_filtering(probs, p):
    """
    Applies top-p (nucleus) filtering to a probability distribution.
    
    probs: dict mapping token_id -> probability
    p: cumulative probability threshold
    
    Returns filtered probabilities normalized to sum to 1
    """
    if p < 0 or p > 1:
        raise ValueError("p must be between 0 and 1")
        
    sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
    
    cumulative_prob = 0.0
    filtered_probs = {}
    
    for token_id, prob in sorted_probs:
        filtered_probs[token_id] = prob
        cumulative_prob += prob
        if cumulative_prob >= p:
            break
            
    if not filtered_probs:
        return {}
        
    total = sum(filtered_probs.values())
    for token_id in filtered_probs:
        filtered_probs[token_id] /= total
        
    return filtered_probs
```
