export const handleDebounce = () => {
  let timeoutId;
  return (callBack, wait) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callBack, wait);
  }
}

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const memoizeRGB = () => {
  const cache = {};
  return (r, g, b) => {
    if(cache[`${r}${g}${b}`]) {
      return cache[`${r}${g}${b}`]
    } else {
      const hex = rgbToHex(r, g, b);
      return cache[`${r}${g}${b}`] = hex;
    }
  }
} 
