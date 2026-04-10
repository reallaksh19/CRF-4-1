from playwright.sync_api import sync_playwright
import os

def test_misc_calc():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--allow-file-access-from-files'])
        page = browser.new_page()
        try:
            # Navigate to the local file
            file_path = f"file://{os.path.abspath('viewer/index.html')}"
            page.goto(file_path)
            page.wait_for_timeout(1000)

            # Switch to the misc calc tab by clicking the button
            page.locator('button.tab-btn:has-text("Misc. Calc")').click()
            page.wait_for_timeout(1000)

            page.locator('li.calc-nav-item[data-target="mc-rvforce"]').click()
            page.wait_for_timeout(500)

            # Take a screenshot
            page.screenshot(path='/home/jules/verification/verification4.png', full_page=True)
            print("Screenshot taken.")
        finally:
            browser.close()

if __name__ == "__main__":
    test_misc_calc()
