import httpx
import asyncio
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_result

# --- Constants ---
CREATE_TASK_URL = "https://api.2captcha.com/createTask"
GET_TASK_RESULT_URL = "https://api.2captcha.com/getTaskResult"

# --- Helper Functions ---
def _is_result_not_ready(result: Optional[str]) -> bool:
    """Return True if the result is None, indicating the captcha is not ready."""
    return result is None

# --- Main Solver Logic ---
class CaptchaSolver:
    """
    A class to interact with the 2Captcha API to solve reCAPTCHA.
    """

    def __init__(self, api_key: str, site_url: str, site_key: str):
        """
        Initializes the solver with necessary credentials.

        Args:
            api_key: Your API key from 2Captcha.
            site_url: The URL of the page with the reCAPTCHA.
            site_key: The site key of the reCAPTCHA (data-sitekey).
        """
        if not all([api_key, site_url, site_key]):
            raise ValueError("API key, site URL, and site key must be provided.")
        self.api_key = api_key
        self.site_url = site_url
        self.site_key = site_key
        # Use a single async client for all requests to manage connections efficiently
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _create_task(self) -> Optional[int]:
        """
        Submits a reCAPTCHA solving task to 2Captcha.

        Returns:
            The task ID if successful, otherwise None.
        """
        payload = {
            "clientKey": self.api_key,
            "task": {
                "type": "RecaptchaV2EnterpriseTaskProxyLess",
                "websiteURL": self.site_url,
                "websiteKey": self.site_key,
            },
        }
        try:
            response = await self.client.post(CREATE_TASK_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            if result.get("errorId") == 0 and result.get("taskId"):
                print(f"Captcha task created with ID: {result['taskId']}")
                return result["taskId"]
            else:
                print(f"Error creating captcha task: {result.get('errorDescription')}")
                return None
        except httpx.RequestError as e:
            print(f"HTTP error while creating captcha task: {e}")
            return None

    async def _get_task_result(self, task_id: int) -> Optional[str]:
        """
        Polls for the result of a captcha solving task.

        Args:
            task_id: The ID of the task to check.

        Returns:
            The g-recaptcha-response token if ready, otherwise None.
        """
        payload = {"clientKey": self.api_key, "taskId": task_id}
        try:
            response = await self.client.post(GET_TASK_RESULT_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get("errorId") > 0:
                print(f"Error polling captcha result: {result.get('errorDescription')}")
                return None # Stop polling on error

            status = result.get("status")
            if status == "ready":
                return result.get("solution", {}).get("gRecaptchaResponse")
            elif status == "processing":
                print(f"Captcha task {task_id} is still processing...")
                return None # Signal to retry
            else:
                print(f"Unknown captcha status: {status}")
                return None # Stop polling on unknown status
        except httpx.RequestError as e:
            print(f"HTTP error while polling captcha result: {e}")
            return None

    @retry(
        stop=stop_after_attempt(24),  # Approx 2 minutes (24 attempts * 5s wait)
        wait=wait_fixed(5),
        retry=retry_if_result(_is_result_not_ready),
        reraise=True # Reraise the last exception if all retries fail
    )
    async def _poll_for_solution(self, task_id: int) -> Optional[str]:
        """
        A wrapper for _get_task_result with tenacity retry logic.
        This function will be called repeatedly until it returns a non-None value
        or the stop condition is met.
        """
        print(f"Polling for result of task {task_id}...")
        return await self._get_task_result(task_id)

    async def solve(self) -> Optional[str]:
        """
        Executes the full captcha solving process.

        1. Creates a task.
        2. Polls for the result until it's ready.

        Returns:
            The g-recaptcha-response token, or None if the process fails.
        """
        task_id = await self._create_task()
        if not task_id:
            return None
        
        try:
            solution = await self._poll_for_solution(task_id)
            if solution:
                print(f"Captcha solved successfully for task {task_id}.")
            else:
                print(f"Failed to get captcha solution for task {task_id} after multiple attempts.")
            return solution
        except Exception as e:
            print(f"An unexpected error occurred during polling for task {task_id}: {e}")
            return None
        finally:
            # Ensure the client is closed when the solver is done.
            # In a larger application, the client's lifecycle might be managed elsewhere.
            await self.client.aclose()
