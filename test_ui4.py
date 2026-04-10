from playwright.sync_api import sync_playwright
import os

def test_glb_pcf():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--allow-file-access-from-files'])
        page = browser.new_page()
        try:
            file_path = f"file://{os.path.abspath('viewer/index.html')}"
            page.goto(file_path)
            page.wait_for_timeout(1000)

            page.locator('button.tab-btn:has-text("GLB Export")').click()
            page.wait_for_timeout(1000)

            # Since no parsed state exists on startup, the file upload should be enabled
            file_input_disabled = page.locator('#pcf-file-input').is_disabled()
            print("Is file input disabled?", file_input_disabled)

        finally:
            browser.close()

if __name__ == "__main__":
    test_glb_pcf()
