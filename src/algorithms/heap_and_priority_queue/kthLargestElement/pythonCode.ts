export const KTH_LARGEST_ELEMENT_CODE = `import heapq

def findKthLargest(nums, k):
    min_heap = []
    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)
    return min_heap[0]`;

export const KTH_LARGEST_CODE = KTH_LARGEST_ELEMENT_CODE;
