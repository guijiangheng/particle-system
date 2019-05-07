import App from './App';
import '../styles.css';

const app = new App();
app.setSize(window.innerWidth, window.innerHeight);
document.body.append(app.renderer.domElement);

(function animate() {
  requestAnimationFrame(animate);
  app.update();
})();

window.onresize = () => app.setSize(window.innerWidth, window.innerHeight);
