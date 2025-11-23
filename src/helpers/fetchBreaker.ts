import CircuitBreaker from "./CircuitBreaker";

const fetchBreaker = new CircuitBreaker(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },
  3,
  30000
); // 3 failures, 30s timeout

export default fetchBreaker;
