import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

url = os.environ.get('LIBRARY_TEST_URL', 'http://127.0.0.1:3000')
screenshots = Path('test-results')
screenshots.mkdir(exist_ok=True)

with sync_playwright() as p:
    options = {'headless': True, 'args': ['--no-sandbox']}
    if shutil.which('chromium'):
        options['executable_path'] = shutil.which('chromium')
    browser = p.chromium.launch(**options)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    response = page.goto(url)
    assert response.status == 200
    page.locator('.artifact-card').wait_for()
    assert page.locator('h1').inner_text() == 'Stories worth\nkeeping.'
    assert page.locator('.artifact-card').count() == 1
    assert page.locator('.collection[open]').count() == 1
    page.get_by_text('Autobiographies', exact=True).click()
    assert page.get_by_text('No artifacts yet', exact=True).is_visible()
    page.screenshot(path=str(screenshots / 'home-desktop.png'), full_page=True)

    page.locator('#search').fill('Oswald')
    assert page.locator('.artifact-card').count() == 1
    assert page.locator('.match').is_visible()
    assert 'q=Oswald' in page.url
    page.reload()
    page.locator('.artifact-card').wait_for()
    assert page.locator('#search').input_value() == 'Oswald'
    page.locator('#search').fill('zz-no-matching-artifact')
    assert page.locator('.artifact-card').count() == 0
    assert page.get_by_text('No stories found.', exact=True).is_visible()
    page.get_by_role('button', name='Clear search').click()
    assert page.locator('.artifact-card').count() == 1
    page.locator('.artifact-card').click()
    page.locator('.artifact-frame').wait_for()
    assert page.url.endswith('/acquired/the-walt-disney-company/')
    frame = page.frame_locator('.artifact-frame')
    frame.locator('.chapter').first.wait_for()
    assert frame.locator('#chapters > .chapter').count() == 14
    frame.locator('[data-node="1"]').click()
    assert frame.locator('[data-node="1"]').get_attribute('aria-pressed') == 'true'
    assert 'daily life' in frame.locator('#wheelpanel').inner_text()
    frame.locator('img').evaluate_all('(xs) => xs.forEach(x => x.loading = "eager")')
    frame.locator('img').evaluate_all('async (xs) => { await Promise.all(xs.map(x => x.decode())); }')
    assert frame.locator('img').evaluate_all('(xs) => xs.every(x => x.complete && x.naturalWidth > 0)')
    page.screenshot(path=str(screenshots / 'artifact-desktop.png'))
    page.reload()
    page.locator('.artifact-frame').wait_for()
    assert page.get_by_role('heading', name='The Walt Disney Company', exact=True).is_visible()

    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(url)
    page.locator('.artifact-card').wait_for()
    assert not page.locator('#sidebar').is_visible()
    page.get_by_role('button', name='Browse').click()
    assert page.locator('#sidebar').is_visible()
    page.locator('#search').fill('Disney')
    page.locator('#search').press('Enter')
    assert not page.locator('#sidebar').is_visible()
    assert page.locator('.artifact-card').count() == 1
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(screenshots / 'home-mobile.png'), full_page=True)
    page.locator('.artifact-card').click()
    page.locator('.artifact-frame').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(screenshots / 'artifact-mobile.png'))
    assert page.request.get(url + '/missing-page/').status == 404
    assert not errors, errors
    browser.close()
    print('Passed: desktop and mobile navigation, chapter search, empty results, direct-route reload, 14 artifact chapters, images, interactive flywheel, 404, and no page errors.')
