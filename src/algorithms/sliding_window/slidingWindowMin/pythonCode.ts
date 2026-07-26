export const SLIDING_WINDOW_MIN_CODE = `from collections import deque

def sliding_window_min(nums: list[int], k: int) -> list[int]:
    result = []
    dq = deque()  # stores indices
    
    for i in range(len(nums)):
        # Remove indices outside current window boundary
        while dq and dq[0] <= i - k:
            dq.popleft()
            
        # Maintain monotonic increasing deque (pop larger elements)
        while dq and nums[dq[-1]] >= nums[i]:
            dq.pop()
            
        dq.append(i)
        
        # Record window minimum once window reaches size k
        if i >= k - 1:
            result.append(nums[dq[0]])
            
    return result`;
