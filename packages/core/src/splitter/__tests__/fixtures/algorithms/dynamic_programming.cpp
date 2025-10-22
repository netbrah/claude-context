// Dynamic Programming classic problems
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <climits>

namespace dp {

// Fibonacci with memoization
class Fibonacci {
private:
    std::vector<long long> memo;
    
public:
    long long calculate(int n) {
        if (n <= 1) return n;
        
        if (memo.size() <= n) {
            memo.resize(n + 1, -1);
        }
        
        if (memo[n] != -1) {
            return memo[n];
        }
        
        memo[n] = calculate(n - 1) + calculate(n - 2);
        return memo[n];
    }
};

// Longest Common Subsequence
int longestCommonSubsequence(const std::string& text1, const std::string& text2) {
    int m = text1.length();
    int n = text2.length();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1[i - 1] == text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp[m][n];
}

// Longest Increasing Subsequence
int longestIncreasingSubsequence(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    
    int n = nums.size();
    std::vector<int> dp(n, 1);
    int maxLen = 1;
    
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[i] > nums[j]) {
                dp[i] = std::max(dp[i], dp[j] + 1);
            }
        }
        maxLen = std::max(maxLen, dp[i]);
    }
    
    return maxLen;
}

// 0/1 Knapsack Problem
int knapsack(const std::vector<int>& weights, const std::vector<int>& values, int capacity) {
    int n = weights.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(capacity + 1, 0));
    
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = std::max(
                    values[i - 1] + dp[i - 1][w - weights[i - 1]],
                    dp[i - 1][w]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    
    return dp[n][capacity];
}

// Coin Change Problem (minimum coins)
int coinChange(const std::vector<int>& coins, int amount) {
    std::vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (i >= coin) {
                dp[i] = std::min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    
    return dp[amount] > amount ? -1 : dp[amount];
}

// Edit Distance (Levenshtein Distance)
int editDistance(const std::string& word1, const std::string& word2) {
    int m = word1.length();
    int n = word2.length();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1));
    
    for (int i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    
    for (int j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1[i - 1] == word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + std::min({
                    dp[i - 1][j],     // delete
                    dp[i][j - 1],     // insert
                    dp[i - 1][j - 1]  // replace
                });
            }
        }
    }
    
    return dp[m][n];
}

// Matrix Chain Multiplication
int matrixChainMultiplication(const std::vector<int>& dims) {
    int n = dims.size() - 1;
    std::vector<std::vector<int>> dp(n, std::vector<int>(n, 0));
    
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i < n - len + 1; i++) {
            int j = i + len - 1;
            dp[i][j] = INT_MAX;
            
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + 
                          dims[i] * dims[k + 1] * dims[j + 1];
                dp[i][j] = std::min(dp[i][j], cost);
            }
        }
    }
    
    return dp[0][n - 1];
}

// Partition Equal Subset Sum
bool canPartition(const std::vector<int>& nums) {
    int sum = 0;
    for (int num : nums) {
        sum += num;
    }
    
    if (sum % 2 != 0) return false;
    
    int target = sum / 2;
    std::vector<bool> dp(target + 1, false);
    dp[0] = true;
    
    for (int num : nums) {
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }
    
    return dp[target];
}

// Maximum Subarray Sum (Kadane's Algorithm)
int maxSubarraySum(const std::vector<int>& nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    
    for (size_t i = 1; i < nums.size(); i++) {
        currentSum = std::max(nums[i], currentSum + nums[i]);
        maxSum = std::max(maxSum, currentSum);
    }
    
    return maxSum;
}

} // namespace dp
