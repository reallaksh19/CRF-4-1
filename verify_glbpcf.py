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

            # Create a mock PCF file to test
            with open('/home/jules/verification/mock.pcf', 'w') as f:
                f.write("""
ISOGEN-FILES ISOGEN.FLS
UNITS-BORE MM
UNITS-CO-ORDS MM
PIPELINE-REFERENCE MOCK-LINE

PIPE
  END-POINT 0 0 0 100
  END-POINT 1000 0 0 100

REDUCER
  END-POINT 1000 0 0 100
  END-POINT 1200 0 0 50

PIPE
  END-POINT 1200 0 0 50
  END-POINT 2000 0 0 50
                """)

            # Upload the file
            page.locator('#pcf-file-input').set_input_files('/home/jules/verification/mock.pcf')
            page.wait_for_timeout(500)

            # Run the pipeline
            page.locator('#btn-run-pipeline').click()
            page.wait_for_timeout(3000)

            page.screenshot(path='/home/jules/verification/glb-export.png', full_page=True)
            print("GLB export logic ran successfully and captured screenshot.")

        finally:
            browser.close()

if __name__ == "__main__":
    test_glb_pcf()
