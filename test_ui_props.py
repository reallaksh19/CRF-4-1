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

            # Upload the file
            page.locator('#pcf-file-input').set_input_files('/home/jules/verification/STEAM_SISO.pcf')
            page.wait_for_timeout(500)

            # Run the pipeline
            page.locator('#btn-run-pipeline').click()
            page.wait_for_timeout(3000)

            # Click middle of preview to hit a pipe
            box = page.locator('#preview-container').bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                page.wait_for_timeout(1000)

                # Check property panel visibility
                is_visible = page.locator('#glb-property-panel').is_visible()
                print("Is property panel visible?", is_visible)

                page.screenshot(path='/home/jules/verification/glb-props.png', full_page=True)
                print("Screenshot taken.")

        finally:
            browser.close()

if __name__ == "__main__":
    test_glb_pcf()
