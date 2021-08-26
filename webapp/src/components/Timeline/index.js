import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/core/styles'
import Timeline from '@material-ui/lab/Timeline'
import TimelineItem from '@material-ui/lab/TimelineItem'
import TimelineSeparator from '@material-ui/lab/TimelineSeparator'
import TimelineConnector from '@material-ui/lab/TimelineConnector'
import TimelineDot from '@material-ui/lab/TimelineDot'
import TimelineContent from '@material-ui/lab/TimelineContent'
import TimelineOppositeContent from '@material-ui/lab/TimelineOppositeContent'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import moment from 'moment'

import { mainConfig } from '../../config'
import { getLastCharacters } from '../../utils'

import AddSvg from './Add.js'
import CloseSvg from './Close.js'
import CancelSvg from './Cancel.js'
import CheckSvg from './Check.js'
import DollarSvg from './Dollar.js'
import PlusSvg from './Plus.js'
import QuestionSvg from './Question.js'
import styles from './styles'

const useStyles = makeStyles(styles)

const TimelineIcon = ({ action, color }) => {
  let icon = null

  switch (action) {
    case 'addref':
      icon = <QuestionSvg color={color} />
      break

    case 'newaccount':
      icon = <CheckSvg color={color} />
      break

    case 'verifyacc':
      icon = <AddSvg color={color} />
      break

    case 'verifyexp':
      icon = <CloseSvg color={color} />
      break

    case 'verifykyc':
      icon = <PlusSvg color={color} />
      break

    case 'payref':
      icon = <DollarSvg color={color} />
      break

    case 'rejectref':
      icon = <CancelSvg color={color} />
      break

    default:
      icon = <QuestionSvg color={color} />
      break
  }

  return icon
}

TimelineIcon.propTypes = {
  action: PropTypes.string,
  color: PropTypes.string
}

const CustomizedTimeline = ({ items, itemHasAction }) => {
  const classes = useStyles()
  const { t } = useTranslation('timeline')

  return (
    <Timeline align="alternate" classes={{ root: classes.main }}>
      {items.map((item, index) => (
        <TimelineItem key={index}>
          <TimelineOppositeContent>
            <Typography
              variant="body2"
              color="textSecondary"
              className={classes.date}
            >
              {moment(item.block_time).format('MM/DD/YYYY hh:mmA')}
            </Typography>
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot
              color="primary"
              variant="outlined"
              classes={{
                root: clsx(classes.item, {
                  [classes.secondaryColor]:
                    itemHasAction && items.length - 1 === index
                })
              }}
            >
              <TimelineIcon
                color={
                  itemHasAction && items.length - 1 === index
                    ? '#1DAEFF'
                    : '#582ACB'
                }
                action={item.action}
              />
            </TimelineDot>
            {items.length - 1 !== index && (
              <TimelineConnector className={classes.secondaryTail} />
            )}
          </TimelineSeparator>

          <TimelineContent classes={{ root: classes.paperWrapper }}>
            <Paper elevation={3} className={classes.paper}>
              <Typography className={classes.infomation}>
                {t(item.action)}
              </Typography>
              <a
                rel="noreferrer"
                target="_blank"
                href={`${mainConfig.blockExplorer}/transaction/${item.trxid}`}
              >
                {getLastCharacters(item.trxid)}
              </a>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

CustomizedTimeline.propTypes = {
  items: PropTypes.array,
  itemHasAction: PropTypes.bool
}

CustomizedTimeline.defaultProps = {
  items: [],
  itemHasAction: false
}

export default CustomizedTimeline
