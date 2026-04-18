import Link from 'next/link'
import classes from './button.module.css'

type Props = {
  children: React.ReactNode
  link?: string
  onClick?: () => void
  disabled?: boolean
}

export default function Button({ children, link, onClick, disabled }: Props) {
  if (link) {
    return <Link href={link} className={classes.btn}>{children}</Link>
  }
  return (
    <button className={classes.btn} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
