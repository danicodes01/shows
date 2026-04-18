import classes from './error-alert.module.css'

export default function ErrorAlert({ children }: { children: React.ReactNode }) {
  return <div className={classes.alert}>{children}</div>
}
