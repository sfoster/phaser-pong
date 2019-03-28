"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

function showPanel(id, bounds) {
  let panel = document.getElementById(`panel-${id}`);
  for (let edge of ["top", "right", "bottom", "left"]) {
    panel.style[edge] = `${bounds[edge]}px`;
  }
  panel.style.display = "flex";
}

function hidePanel(id) {
  let panel = document.getElementById(`panel-${id}`);
  panel.style.cssText = "display: none";
}

function hideAllPanels() {
  for (let panel of document.querySelectorAll(".panel")) {
    panel.style.cssText = "display: none";
  }
}

function handlePanelEvent(id, selector, types, handler) {
  let panel = document.getElementById(`panel-${id}`);
  let target = panel.querySelector(selector);
  if (!Array.isArray(types)) {
    types = [types];
  }
  for (let type of types) {
    target.addEventListener(type, handler);
  }
  let remover = {
    target,
    remove() {
      for (let type of types) {
        target.removeEventListener(type, handler);
      }
    }
  };
  return remover;
}

const uiUtils = {
  showPanel,
  hidePanel,
  hideAllPanels,
  handlePanelEvent,
};
