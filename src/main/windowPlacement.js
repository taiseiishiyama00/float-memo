export function computeInitialBounds(screenSize, windowSize) {
  const x = Math.round(screenSize.width * 0.75 - windowSize.width * 0.5);
  const y = Math.round(screenSize.height * 0.75 - windowSize.height * 0.5);

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: windowSize.width,
    height: windowSize.height
  };
}

export function clampBoundsToWorkArea(bounds, workArea) {
  const maxX = workArea.x + workArea.width - bounds.width;
  const maxY = workArea.y + workArea.height - bounds.height;
  const x = Math.min(Math.max(bounds.x, workArea.x), maxX);
  const y = Math.min(Math.max(bounds.y, workArea.y), maxY);

  return { ...bounds, x, y };
}
