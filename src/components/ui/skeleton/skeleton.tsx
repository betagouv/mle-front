import clsx from 'clsx'
import styles from './skeleton.module.css'

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={clsx(styles.animatePulse, className)} {...props} />
}

export { Skeleton }
