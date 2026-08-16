/**
 * CSS Modules type declaration for this package. Re-exports the shared client
 * declaration so tsdown lightningcss can resolve `.module.css` imports.
 */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
