import { useWindowSize } from 'usehooks-ts'

export const useIsMobile = () => useWindowSize().width < 768
