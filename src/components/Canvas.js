import React, { forwardRef } from 'react';

const Canvas = forwardRef((props, ref) => <canvas {...props} ref={ref} />)

export default Canvas;