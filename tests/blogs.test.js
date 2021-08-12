const Page = require('./helpers/page');

let page;

beforeEach(async () => {
	page = await Page.build();
	await page.goto('localhost:3000');
});

afterEach(async () => {
	await page.close();
});

describe('When logged in', async () => {
	beforeEach(async () => {
		await page.login();
		await page.click('a.btn-floating');
	});

	test('can see new blog form', async () => {
		const label = await page.getContentsOf('form label');

		expect(label).toEqual('Blog Title');
	});

	describe('And using valid inputs to the blog form', async () => {
		beforeEach(async () => {
			await page.type('.title input', 'Testing using JEST');
			await page.type('.content input', 'Content added');
			await page.click('form button');
		});

		test('submitting takes user to the review screen', async () => {
			const confirmText = await page.getContentsOf('h5');
			expect(confirmText).toEqual('Please confirm your entries');
		});

		test('submitting then saving takes user to the blogs screen', async () => {
			await page.click('button.green');
			await page.waitForSelector('.card');
			const blogTitle = await page.getContentsOf('.card-title');
			const blogContent = await page.getContentsOf('p');

			expect(blogTitle).toEqual('Testing using JEST');
			expect(blogContent).toEqual('Content added');
		});
	});

	describe('And using invalid inputs to the form', async () => {
		beforeEach(async () => {
			await page.click('form button');
		});

		test('the form shows the error message', async () => {
			const titleError = await page.getContentsOf('.title .red-text');
			const contentError = await page.getContentsOf('.content .red-text');

			expect(titleError).toEqual('You must provide a value');
			expect(contentError).toEqual('You must provide a value');
		});
	});
});

describe('User is not logged in', async () => {
	test('user cannot create blog posts', async () => {
		const result = await page.evaluate(() => {
			return fetch('/api/blogs', {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title: 'New title', content: 'New content' }),
			}).then((res) => res.json());
		});

		expect(result).toEqual({ error: 'You must log in!' });
	});

	test('user cannot see any blogs', async() => {
		const result = await page.evaluate(() => {
			return fetch('/api/blogs', {
				method: 'GET',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res.json());
		});

		expect(result).toEqual({ error: 'You must log in!' });
	})
});
