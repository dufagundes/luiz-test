import React from 'react';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';

/** waits for the web font before anything (including 3D sign textures) is drawn */
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = React.useState(() => delayRender('Loading Baloo 2 font'));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    Promise.all([document.fonts.load('800 100px "Baloo 2"'), document.fonts.load('700 100px "Baloo 2"')])
      .catch(() => undefined)
      .then(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
