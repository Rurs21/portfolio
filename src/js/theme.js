/**
 * Theme 
 */

export function setupTheme() {
	// Get the theme-toggle button and body element
	const themeToggle = document.getElementById('theme-toggle');
	const body = document.body;

	const checkUserTheme = function() {
		const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const savedTheme = localStorage.getItem('theme');
		
		// Set previously selected theme
		if (savedTheme != null) {
			changeTheme(savedTheme)
		}
		else if (prefersDarkMode) {
			changeTheme('dark')
		}
	}

	const changeTheme = function(theme) {
		if (theme == 'dark') {
			body.classList.add('dark');
			themeToggle.textContent = '☾';
		} else {
			body.classList.remove('dark');
			themeToggle.textContent = '✹';
		}

		// Save the theme preference to localStorage
		localStorage.setItem('theme', theme);
	}

	const toggleTheme = function() {
		const isDark = body.classList.contains('dark');
		isDark ? changeTheme('light') : changeTheme('dark');
	}

	// Add a click event listener to the theme-toggle button
	themeToggle.addEventListener('click', toggleTheme);
	// Add event listener is the prefers color scheme change
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		const newScheme = event.matches ? "dark" : "light";
		changeTheme(newScheme)
	});
	
	checkUserTheme();
}