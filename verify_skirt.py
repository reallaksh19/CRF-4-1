from playwright.sync_api import sync_playwright
import os

def test_skirt():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--allow-file-access-from-files'])
        page = browser.new_page()
        try:
            file_path = f"file://{os.path.abspath('viewer/index.html')}"
            page.goto(file_path)
            page.wait_for_timeout(1000)

            page.locator('button.tab-btn:has-text("Misc. Calc")').click()
            page.wait_for_timeout(1000)

            # Take a screenshot to verify skirt text
            page.screenshot(path='/home/jules/verification/skirt.png')
            print("Screenshot taken.")

        finally:
            browser.close()

if __name__ == "__main__":
    test_skirt()
