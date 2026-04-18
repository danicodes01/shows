import classes from './show-excerpt.module.css'

function ShowExcerpt ({ excerpt }) {
  const refactoredExcert = excerpt.replace(/\n/g,'<br />')
  return <div className={`center ${classes.excerpt}`} dangerouslySetInnerHTML={{
    __html: refactoredExcert
}}></div>
}
export default ShowExcerpt
