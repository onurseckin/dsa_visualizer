# Domain 04: Classical ML and Data Science

## Topic 13: Linear & Logistic Regression

### Part A: Algorithmic Foundations
1. [Best Position for a Service Centre](https://leetcode.com/problems/best-position-for-a-service-centre/)
2. [Maximum Number of Visible Points](https://leetcode.com/problems/maximum-number-of-visible-points/)
3. [Minimum Cost to Make Array Equal](https://leetcode.com/problems/minimum-cost-to-make-array-equal/)
4. [Valid Square](https://leetcode.com/problems/valid-square/)

### Part B: Mathematical Proofs
1. Derive the gradient of the binary cross-entropy loss with respect to the weights in logistic regression.
2. Prove that the logistic regression objective is convex.
3. Show that Ordinary Least Squares (OLS) has a closed-form solution.

### Part C: ML Systems Questions
1. How does feature scaling affect the convergence of Gradient Descent in Logistic Regression?
2. Explain the difference in implementation and convergence for full-batch GD vs SGD for regression models.
3. What is the impact of multi-collinearity on OLS and how does L2 regularization solve it?

### Part D: Edge Cases / Stress Tests
1. Perfectly separable data causing weights to diverge to infinity (complete separation).
2. Extremely high learning rate causing divergence.
3. Dataset with more features than samples (p > n).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-13`
```python
import math

def sigmoid(z):
    if z < -100:
        return 0.0
    if z > 100:
        return 1.0
    return 1.0 / (1.0 + math.exp(-z))

def logistic_regression_gd(X, y, lr, iterations):
    """
    Performs gradient descent for logistic regression.
    X: list of lists (samples x features)
    y: list of binary labels (0 or 1)
    lr: learning rate
    iterations: number of epochs
    
    Returns: list of weights
    """
    if not X or not X[0]:
        return []
    
    n_samples = len(X)
    n_features = len(X[0])
    weights = [0.0] * n_features
    
    for _ in range(iterations):
        gradients = [0.0] * n_features
        for i in range(n_samples):
            z = sum(X[i][j] * weights[j] for j in range(n_features))
            pred = sigmoid(z)
            error = pred - y[i]
            
            for j in range(n_features):
                gradients[j] += error * X[i][j]
                
        for j in range(n_features):
            weights[j] -= lr * (gradients[j] / n_samples)
            
    return weights
```

## Topic 14: Decision Trees & Forests

### Part A: Algorithmic Foundations
1. [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
2. [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)
3. [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)

### Part B: Mathematical Proofs
1. Prove that the Gini impurity is maximum when classes are perfectly balanced.
2. Show that Information Gain is always non-negative.
3. Prove that deep unpruned decision trees can perfectly memorize any training dataset with distinct features.

### Part C: ML Systems Questions
1. How do you efficiently find the best split for continuous features without sorting the entire dataset repeatedly?
2. Why is Random Forest typically highly parallelizable, and how is it implemented across multiple workers?
3. How is memory managed when building deep decision trees on datasets larger than RAM?

### Part D: Edge Cases / Stress Tests
1. Dataset where all features have the exact same value but target labels differ.
2. Dataset with only a single sample.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-14`
```python
def gini_impurity(y):
    if not y:
        return 0.0
    counts = {}
    for label in y:
        counts[label] = counts.get(label, 0) + 1
    
    impurity = 1.0
    for count in counts.values():
        prob = count / len(y)
        impurity -= prob ** 2
    return impurity

def find_best_split_gini(X, y):
    """
    Finds the best split (feature index, threshold) based on Gini impurity.
    X: list of lists (samples x features), continuous features
    y: list of labels
    
    Returns: (best_feature_idx, best_threshold)
    """
    n_samples = len(X)
    n_features = len(X[0]) if n_samples > 0 else 0
    
    best_gini = float('inf')
    best_split = (None, None)
    
    for feature_idx in range(n_features):
        feature_values = sorted(set(X[i][feature_idx] for i in range(n_samples)))
        
        for i in range(len(feature_values) - 1):
            threshold = (feature_values[i] + feature_values[i+1]) / 2.0
            
            left_y = [y[j] for j in range(n_samples) if X[j][feature_idx] <= threshold]
            right_y = [y[j] for j in range(n_samples) if X[j][feature_idx] > threshold]
            
            if not left_y or not right_y:
                continue
                
            gini_left = gini_impurity(left_y)
            gini_right = gini_impurity(right_y)
            
            weighted_gini = (len(left_y) * gini_left + len(right_y) * gini_right) / n_samples
            
            if weighted_gini < best_gini:
                best_gini = weighted_gini
                best_split = (feature_idx, threshold)
                
    return best_split
```

## Topic 15: Gradient Boosting

### Part A: Algorithmic Foundations
1. [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)
2. [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)
3. [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/)

### Part B: Mathematical Proofs
1. Derive the optimal leaf weight formula in XGBoost using the second-order Taylor expansion of the loss function.
2. Prove the split gain formula for a given node in XGBoost based on gradients and hessians.

### Part C: ML Systems Questions
1. How does XGBoost handle missing values during training?
2. What is histogram-based splitting in LightGBM and how does it speed up training?
3. Discuss the differences between level-wise (XGBoost) and leaf-wise (LightGBM) tree growth.

### Part D: Edge Cases / Stress Tests
1. Sum of hessians in a node is less than min_child_weight.
2. Large regularization parameter lambda causing splits to yield negative gain.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-15`
```python
def xgboost_exact_split_gain(g, h, l2_reg, min_child_weight):
    """
    Calculates the maximum split gain for a set of gradients and hessians.
    """
    n = len(g)
    G = sum(g)
    H = sum(h)
    
    if H < 2 * min_child_weight:
        return 0.0
        
    best_gain = 0.0
    G_left = 0.0
    H_left = 0.0
    
    for i in range(n - 1):
        G_left += g[i]
        H_left += h[i]
        
        G_right = G - G_left
        H_right = H - H_left
        
        if H_left < min_child_weight or H_right < min_child_weight:
            continue
            
        gain = (G_left**2 / (H_left + l2_reg)) + (G_right**2 / (H_right + l2_reg)) - (G**2 / (H + l2_reg))
        gain = 0.5 * gain
        
        if gain > best_gain:
            best_gain = gain
            
    return best_gain
```

## Topic 16: K-Means & Clustering

### Part A: Algorithmic Foundations
1. [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)
2. [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/)
3. [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/)

### Part B: Mathematical Proofs
1. Prove that Lloyd's algorithm for K-Means monotonically decreases the within-cluster sum of squares (WCSS).
2. Prove the bound for the approximation ratio of K-Means++ initialization.

### Part C: ML Systems Questions
1. How do you scale K-Means for datasets that do not fit in memory? (Mini-batch K-Means)
2. What are the advantages of using KD-Trees or Ball Trees for finding the nearest centroid?

### Part D: Edge Cases / Stress Tests
1. k is greater than the number of unique points in the dataset.
2. Points perfectly equidistant from multiple centroids.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-16`
```python
import random

def euclidean_dist_sq(p1, p2):
    return sum((x - y) ** 2 for x, y in zip(p1, p2))

def kmeans_pp_init(X, k):
    """
    Initializes k centroids using the K-Means++ algorithm.
    """
    if not X or k <= 0:
        return []
    
    n_samples = len(X)
    k = min(k, n_samples)
    
    centroids = [X[0]]  # Deterministic for testability, though usually random
    
    for _ in range(1, k):
        distances = []
        for point in X:
            min_dist_sq = min(euclidean_dist_sq(point, c) for c in centroids)
            distances.append(min_dist_sq)
            
        total_dist = sum(distances)
        
        if total_dist == 0:
            remaining = [p for p in X if p not in centroids]
            if remaining:
                centroids.append(remaining[0])
            else:
                break
            continue
            
        r = random.uniform(0, total_dist)
        cumulative = 0.0
        for i, point in enumerate(X):
            cumulative += distances[i]
            if cumulative >= r:
                centroids.append(point)
                break
                
    return centroids
```

## Topic 17: SVMs & Margins

### Part A: Algorithmic Foundations
1. [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)
2. [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/)
3. [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/)

### Part B: Mathematical Proofs
1. Show that maximizing the margin is equivalent to minimizing ||w||^2.
2. State and prove the KKT conditions for the SVM dual optimization problem.

### Part C: ML Systems Questions
1. Why is the kernel trick so computationally powerful for SVMs compared to explicitly projecting features?
2. How is Sequential Minimal Optimization (SMO) used to solve the SVM dual problem efficiently?

### Part D: Edge Cases / Stress Tests
1. Linearly inseparable data without soft margin (leads to no solution).
2. Data points collinear along the decision boundary.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-17`
```python
def linear_svm_decision_function(X, weights, bias):
    """
    Calculates the decision function values for an SVM.
    """
    if not X:
        return []
        
    n_samples = len(X)
    n_features = len(weights)
    
    decisions = []
    for i in range(n_samples):
        val = sum(X[i][j] * weights[j] for j in range(n_features)) + bias
        decisions.append(val)
        
    return decisions
```

## Topic 18: Recommender Systems / Matrix Factorization

### Part A: Algorithmic Foundations
1. [Design Search Autocomplete System](https://leetcode.com/problems/design-search-autocomplete-system/)
2. [LRU Cache](https://leetcode.com/problems/lru-cache/)
3. [LFU Cache](https://leetcode.com/problems/lfu-cache/)

### Part B: Mathematical Proofs
1. Prove that the singular value decomposition (SVD) provides the best low-rank approximation of a matrix in terms of Frobenius norm.
2. Derive the update rule for Alternating Least Squares (ALS) by taking the derivative of the regularized loss function with respect to user latent factors.

### Part C: ML Systems Questions
1. How do you serve recommendations from matrix factorization models with extremely low latency?
2. What are the advantages of Implicit ALS versus Explicit ALS in real-world scenarios?

### Part D: Edge Cases / Stress Tests
1. User with no rated items (cold start problem).
2. Matrix with extreme sparsity and only uninformative ratings (e.g., all 5 stars).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-18`
```python
def als_explicit_step(R, num_factors, num_iterations, reg):
    """
    Performs ALS steps for explicit matrix factorization.
    """
    if not R or not R[0]:
        return [], []
        
    n_users = len(R)
    n_items = len(R[0])
    
    U = [[0.1] * num_factors for _ in range(n_users)]
    V = [[0.1] * num_factors for _ in range(n_items)]
    
    lr = 0.01
    for _ in range(num_iterations):
        for u in range(n_users):
            for i in range(n_items):
                if R[u][i] > 0:
                    pred = sum(U[u][k] * V[i][k] for k in range(num_factors))
                    err = R[u][i] - pred
                    
                    for k in range(num_factors):
                        grad_U = -err * V[i][k] + reg * U[u][k]
                        grad_V = -err * U[u][k] + reg * V[i][k]
                        
                        U[u][k] -= lr * grad_U
                        V[i][k] -= lr * grad_V
                        
    return U, V
```
