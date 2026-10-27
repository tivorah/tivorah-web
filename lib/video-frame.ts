/**
 * A video address that shows a real picture before it plays. Safari (iPhone, and the app's in-app
 * browser) leaves a `preload="metadata"` video black until it plays; asking for 0.1s in makes it draw
 * that frame, so tiles and previews show the video itself instead of a dark box.
 */
export const firstFrame = (url: string) => (url.includes("#") ? url : `${url}#t=0.1`);
