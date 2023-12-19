import classes from './contact-body.module.css'
import MailToButton from '../ui/mail-to-button'
function ContactBodyPage () {
  return (
    <div className={classes.contact}>
      <h2>Write DistortNewYork @:</h2>
      <MailToButton
        label='DistortNewYork@gmail.com'
        mailto='mailto:distortnewyork@gmail.com'
      />
      <hr />
    </div>
  )
}

export default ContactBodyPage

