const isRegisterMode = () => window.location.hash.startsWith('#/register/');
const initialRegisterMode = isRegisterMode();

window.addEventListener('hashchange', () => {
  if (isRegisterMode() !== initialRegisterMode) {
    window.location.reload();
  }
});

if (initialRegisterMode) {
  import('./register-entry.jsx');
} else {
  import('./main.jsx');
}
