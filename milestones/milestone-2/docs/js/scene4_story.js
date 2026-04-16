/* ============================================
   SCENE 4: EARTH STORY - TRENDS PANEL
   ============================================ */

const Scene4 = {
  _inited: false,
  currentView: 'overview', // 'overview' or 'deepdive'

  init() {
    console.log('Initializing Scene 4: Earth Story');

    this.renderPlaceholderExhibit('viz-frequency');
    this.renderPlaceholderExhibit('viz-mortality');
    this.renderPlaceholderExhibit('viz-economic');
    this.renderPlaceholderExhibit('viz-geography');
  },

  renderPlaceholderExhibit(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #666; font-size: 0.9rem; text-align: center;';
    placeholder.textContent = 'Visualization Coming Soon';

    container.appendChild(placeholder);
  },

};
