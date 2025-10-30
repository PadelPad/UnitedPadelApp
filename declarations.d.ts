declare module '*.png' {
  const value: number; // local images are numbers in RN (packager resource IDs)
  export default value;
}
declare module '*.jpg' {
  const value: number;
  export default value;
}
declare module '*.jpeg' {
  const value: number;
  export default value;
}
declare module '*.webp' {
  const value: number;
  export default value;
}
