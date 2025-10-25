import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

/** Build redirect URI for native + web. Default path is /auth/callback */
export function getRedirectTo(path: string = 'auth/callback') {
  return makeRedirectUri({ scheme: 'unitedpadel', path });
}
