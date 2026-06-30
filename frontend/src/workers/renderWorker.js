import { applyPipeline } from '../utils/renderPipeline.js';

self.onmessage = ({ data: { buffer, width, height, adjustments, id } }) => {
  const data = new Uint8ClampedArray(buffer);
  applyPipeline({ data, width, height }, adjustments);
  self.postMessage({ buffer: data.buffer, width, height, id }, [data.buffer]);
};
