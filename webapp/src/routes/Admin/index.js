import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/styles'
import moment from 'moment'
import clsx from 'clsx'
import AddIcon from '@material-ui/icons/Add'
import { useLazyQuery, useMutation } from '@apollo/client'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/Delete'
import Typography from '@material-ui/core/Typography'
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace'
import IconButton from '@material-ui/core/IconButton'
import Fab from '@material-ui/core/Fab'
import Box from '@material-ui/core/Box'
import CircularProgress from '@material-ui/core/CircularProgress'
import Button from '@material-ui/core/Button'

import { mainConfig } from '../../config'
import TableSearch from '../../components/TableSearch'
import CustomizedTimeline from '../../components/Timeline'
import Modal from '../../components/Modal'
import Accordion from '../../components/Accordion'
import FloatingMenu from '../../components/FloatingButton'
import {
  affiliateUtil,
  getUALError,
  useImperativeQuery,
  getLastCharacters
} from '../../utils'
import { useSharedState } from '../../context/state.context'
import {
  GET_HISTORY_BY_INVITEES,
  GET_HISTORY_BY_REFERRERS,
  GET_JOIN_REQUEST,
  DELETE_JOIN_REQUEST_MUTATION
} from '../../gql'

import AddUserModal from './AddUserModal'
import styles from './styles'

const headCellNewUsers = [
  {
    id: 'account',
    align: 'left',
    useMainColor: true,
    rowLink: true,
    label: 'account'
  },
  {
    id: 'applied',
    align: 'center',
    useMainColor: false,
    rowLink: false,
    label: 'applied'
  },
  {
    id: 'email',
    align: 'right',
    useMainColor: true,
    rowLink: false,
    label: 'email'
  }
]
const headCellUserApprovals = [
  {
    id: 'username',
    align: 'left',
    useMainColor: true,
    rowLink: true,
    label: 'account'
  },
  {
    id: 'role',
    align: 'center',
    useMainColor: false,
    rowLink: false,
    label: 'role'
  },
  {
    id: 'reward',
    align: 'center',
    useMainColor: false,
    rowLink: false,
    label: 'reward (XPR)'
  },
  {
    id: 'txid',
    align: 'right',
    useMainColor: true,
    rowLink: false,
    label: 'txid'
  }
]
const headCellReferralPayment = [
  {
    id: 'invitee',
    align: 'left',
    useMainColor: true,
    rowLink: true,
    label: 'invitee'
  },
  {
    id: 'status',
    align: 'center',
    useMainColor: false,
    rowLink: false,
    label: 'status'
  },
  {
    id: 'referrer',
    align: 'center',
    useMainColor: false,
    rowLink: false,
    label: 'affiliate'
  },
  {
    id: 'tx',
    align: 'right',
    useMainColor: true,
    rowLink: true,
    label: 'last tx'
  }
]

const initNewUsersPagination = {
  count: 0,
  rowsPerPage: 5,
  rowsPerPageOptions: [5, 10, 25],
  page: 0
}

const useStyles = makeStyles(styles)

const dateFormat = time => {
  const currentData = moment()
  const diff = currentData.diff(moment(time), 'days')

  if (diff === 0) return 'Today'

  return moment(time).format('ll')
}

const OptionFAB = ({
  type,
  onClickReject,
  onClickRemoveUsers,
  onClickApprovePayment,
  onClickRejectPayment,
  onClickApproveNewUser,
  allowPayment
}) => {
  const classes = useStyles()
  const { t } = useTranslation('adminRoute')
  let result = <></>

  switch (type) {
    case 'new': {
      result = (
        <>
          <Box className={classes.wrapperAction}>
            <Typography className={classes.actionLabel}>
              {t('approveUser')}
            </Typography>
            <Fab
              size="small"
              color="primary"
              aria-label="add"
              onClick={onClickApproveNewUser}
            >
              <CheckIcon />
            </Fab>
          </Box>
          <Box className={classes.wrapperAction}>
            <Typography className={classes.actionLabel}>
              {t('rejectUser')}
            </Typography>
            <Fab
              size="small"
              color="primary"
              aria-label="reject"
              onClick={onClickReject}
            >
              <CloseIcon />
            </Fab>
          </Box>
        </>
      )
      break
    }

    case 'management': {
      result = (
        <Box className={classes.wrapperAction}>
          <Typography className={classes.actionLabel}>
            {t('removeAffiliate')}
          </Typography>
          <Fab
            size="small"
            color="primary"
            aria-label="delete"
            onClick={onClickRemoveUsers}
          >
            <DeleteIcon />
          </Fab>
        </Box>
      )
      break
    }

    case 'payment': {
      result = (
        <>
          <Box className={classes.wrapperAction}>
            <Typography className={classes.actionLabel}>
              {t('approvePayment')}
            </Typography>
            <Fab
              disabled={!allowPayment}
              size="small"
              color="primary"
              aria-label="approve"
              onClick={onClickApprovePayment}
            >
              <CheckIcon />
            </Fab>
          </Box>
          <Box className={classes.wrapperAction}>
            <Typography className={classes.actionLabel}>
              {t('rejectPayment')}
            </Typography>
            <Fab
              disabled={!allowPayment}
              size="small"
              color="primary"
              aria-label="delete"
              onClick={onClickRejectPayment}
            >
              <CloseIcon />
            </Fab>
          </Box>
        </>
      )
      break
    }

    default:
      break
  }

  return result
}

OptionFAB.propTypes = {
  type: PropTypes.string,
  onClickReject: PropTypes.func,
  onClickApprovePayment: PropTypes.func,
  onClickRejectPayment: PropTypes.func,
  onClickApproveNewUser: PropTypes.func,
  allowPayment: PropTypes.bool
}

OptionFAB.defaultProps = {
  onClickReject: () => {},
  onClickRemoveUsers: () => {},
  onClickApproveNewUser: () => {}
}

const Admin = () => {
  const classes = useStyles()
  const { t } = useTranslation('adminRoute')
  const [openFAB, setOpenFAB] = useState(false)
  const loadHistoryByInvites = useImperativeQuery(GET_HISTORY_BY_INVITEES)
  const loadHistoryByReferrers = useImperativeQuery(GET_HISTORY_BY_REFERRERS)
  const [
    loadNewUsers,
    { loading = true, data: { joinRequest, infoJoin } = {} }
  ] = useLazyQuery(GET_JOIN_REQUEST)
  const [deleteJoinRequest, { loading: loadingDelete }] = useMutation(
    DELETE_JOIN_REQUEST_MUTATION
  )
  const [open, setOpen] = useState(false)
  const [openAddUser, setAddUser] = useState(false)
  const [openInfoModal, setOpenInfoModal] = useState(false)
  const [allowPayment, setAllowPayment] = useState(false)
  const [newUsersRows, setNewUserRows] = useState([])
  const [newUsersPagination, setNewUsersPagination] = useState(
    initNewUsersPagination
  )
  const [userRows, setUserRows] = useState([])
  const [userPagination, setUserPagination] = useState({})
  const [referralRows, setReferralRows] = useState([])
  const [referralPagination, setReferralPagination] = useState({})
  const [currentReferral, setCurrentReferral] = useState()
  const [selected, setSelected] = useState({ tableName: null })
  const [{ ual }, { showMessage }] = useSharedState()

  const handleOnLoadMoreUsers = async () => {
    const users = await affiliateUtil.getUsers(userPagination.cursor)
    const referrers = (users.rows || []).map(item => item.user)
    const { data } = await loadHistoryByReferrers({ referrers })
    const newRows = (users.rows || []).map(row => {
      const history = data.history.filter(
        item => item.referral.referrer === row.user
      )
      const trxid = (history[history.length - 1] || {}).trxid

      return {
        ...row,
        username: row.user,
        reward: history.reduce(
          (total, item) => total + item.payload.referrerPayment.amount,
          0
        ),
        txid: getLastCharacters(trxid) || '-'
      }
    })

    setUserRows(userPagination.cursor ? [...userRows, ...newRows] : newRows)
    setUserPagination({
      hasMore: users.hasMore,
      cursor: users.cursor
    })
  }

  const deleteNewUsers = async () => {
    try {
      await deleteJoinRequest({
        variables: {
          ids: selected.new
        }
      })

      setOpenInfoModal(false)

      joinRequest({
        variables: {
          offset: newUsersPagination.page * newUsersPagination.rowsPerPage,
          limit: newUsersPagination.rowsPerPage
        }
      })

      showMessage({ type: 'success', content: t('deleteSuccessfully') })
    } catch (error) {
      showMessage({ type: 'error', content: error })
    }
  }

  const approveNewUser = async () => {
    try {
      const data = await affiliateUtil.addUser(
        ual.activeUser,
        selected.new,
        affiliateUtil.ROLES_IDS.REFERRER
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      setAddUser(false)
      deleteNewUsers()
      reloadUsers()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  const reloadUsers = async () => {
    setUserPagination({
      hasMore: false,
      cursor: ''
    })
    setTimeout(handleOnLoadMoreUsers, 500)
  }

  const handleOnSelectItem = (tableName, items) => {
    if (!items.length) {
      setSelected({ tableName: null })

      return
    }

    setSelected({ [tableName]: items, tableName })
  }

  const handleOnPageChange = (_, page) => {
    setNewUsersPagination(prev => ({
      ...prev,
      page
    }))

    joinRequest({
      variables: {
        offset: page * newUsersPagination.rowsPerPage,
        limit: newUsersPagination.rowsPerPage
      }
    })
  }

  const handleOnLoadMoreReferrals = async () => {
    const referrals = await affiliateUtil.getReferrals(
      referralPagination.cursor
    )
    const invitees = (referrals.rows || []).map(item => item.invitee)
    const { data } = await loadHistoryByInvites({ invitees })
    const newRows = (referrals.rows || []).map(row => {
      const history = data.history.filter(item => item.invitee === row.invitee)
      const trxid = (history[history.length - 1] || {}).trxid

      return {
        ...row,
        history,
        status: t(row.status),
        statusId: row.status,
        tx: getLastCharacters(trxid),
        link: trxid
      }
    })

    setReferralRows(
      referralPagination.cursor ? [...referralRows, ...newRows] : newRows
    )
    setReferralPagination({
      hasMore: referrals.hasMore,
      cursor: referrals.cursor
    })
  }

  const reloadReferrals = () => {
    setReferralPagination({
      hasMore: false,
      cursor: ''
    })
    setTimeout(handleOnLoadMoreReferrals, 500)
  }

  const handleOnClickReferral = data => {
    setOpen(true)
    setCurrentReferral(data)
  }

  const handleOnApprovePayment = async () => {
    try {
      const data = await affiliateUtil.payRef(
        ual.activeUser,
        currentReferral
          ? [currentReferral.invitee]
          : selected[selected.tableName]
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      handleOnClose()
      reloadReferrals()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  const handleOnRejectPayment = async () => {
    try {
      const data = await affiliateUtil.rejectRef(
        ual.activeUser,
        currentReferral
          ? [currentReferral.invitee]
          : selected[selected.tableName]
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      handleOnClose()
      reloadReferrals()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  const handleOnApproveKyc = async () => {
    try {
      const data = await affiliateUtil.approveKyc(
        ual.activeUser,
        currentReferral?.invitee
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      handleOnClose()
      reloadReferrals()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  const handleOnClose = () => {
    setOpen(false)
    setCurrentReferral(null)
  }

  const getAccountName = () => {
    if (!(selected.new || []).length) return ''

    const accountsNames = (newUsersRows || [])
      .filter(item =>
        (selected.new || []).find(selectItem => selectItem === item.id)
      )
      .map(user => user.account)

    return accountsNames.toString()
  }

  const handleOnSubmitAddUser = async payload => {
    try {
      const data = await affiliateUtil.addUser(
        ual.activeUser,
        [payload.account],
        payload.isAdmin
          ? affiliateUtil.ROLES_IDS.ADMIN
          : affiliateUtil.ROLES_IDS.REFERRER
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      setAddUser(false)
      reloadUsers()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  const handleOnRemoveUsers = async () => {
    try {
      const data = await affiliateUtil.removeUsers(
        ual.activeUser,
        selected[selected.tableName]
      )

      showMessage({
        type: 'success',
        content: (
          <a
            href={`${mainConfig.blockExplorer}/transaction/${data.transactionId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${t('success')} ${getLastCharacters(data.transactionId)}`}
          </a>
        )
      })
      setOpenFAB(false)
      setSelected({ tableName: null })
      reloadUsers()
    } catch (error) {
      showMessage({ type: 'error', content: getUALError(error) })
    }
  }

  useEffect(() => {
    if (loading || !joinRequest) return

    const data = (joinRequest || []).map(item => ({
      ...item,
      account: item.account,
      applied: dateFormat(item.created_at),
      email: item.email
    }))

    setNewUsersPagination({
      ...newUsersPagination,
      count: infoJoin.aggregate.count
    })
    setNewUserRows(data)
  }, [loading, joinRequest, infoJoin])

  useEffect(() => {
    if (selected.tableName !== 'payment') {
      return
    }

    const selectedItems = selected[selected.tableName] || []
    const notAllowed = referralRows
      .filter(row => selectedItems.includes(row.invitee))
      .find(
        row =>
          row.statusId !==
          affiliateUtil.REFERRAL_STATUS[
            affiliateUtil.REFERRAL_STATUS_IDS.PENDING_PAYMENT
          ]
      )

    setAllowPayment(!notAllowed)
  }, [selected, referralRows, setAllowPayment])

  useEffect(() => {
    handleOnLoadMoreUsers()
    handleOnLoadMoreReferrals()
    loadNewUsers({
      variables: {
        offset: 0,
        limit: 5
      }
    })
  }, [])

  return (
    <Box className={classes.adminPage}>
      <Box className={classes.adminHead}>
        <Typography className={classes.adminTitle}>{t('title')}</Typography>
        <Typography className={classes.adminInfo}>{t('pageInfo')}</Typography>
      </Box>
      <Accordion title="Referral Payments">
        <TableSearch
          tableName="payment"
          onSelectItem={handleOnSelectItem}
          selected={selected.payment || []}
          useLoadMore
          rows={referralRows}
          showColumnCheck
          headCells={headCellReferralPayment}
          handleOnLoadMore={handleOnLoadMoreReferrals}
          onClickButton={handleOnClickReferral}
          showColumnButton
          idName="invitee"
        />
      </Accordion>
      <Accordion title="New Affiliates">
        <TableSearch
          tableName="new"
          onSelectItem={handleOnSelectItem}
          selected={selected.new || []}
          rows={newUsersRows}
          showColumnCheck
          headCells={headCellNewUsers}
          idName="id"
          pagination={newUsersPagination}
          handleOnPageChange={handleOnPageChange}
          handleOnRowsPerPageChange={() => {}}
          usePagination
        />
      </Accordion>
      <Accordion title="User Management">
        <TableSearch
          tableName="management"
          onSelectItem={handleOnSelectItem}
          selected={selected.management || []}
          useLoadMore
          rows={userRows}
          showColumnCheck
          headCells={headCellUserApprovals}
          handleOnLoadMore={handleOnLoadMoreUsers}
          idName="username"
        />
      </Accordion>
      <FloatingMenu open={openFAB} setOpen={setOpenFAB} label="ACTIONS">
        <Box className={classes.fabBox}>
          <Box className={classes.wrapperAction}>
            <Typography className={classes.actionLabel}>
              {t('addAccount')}
            </Typography>
            <Fab
              size="small"
              color="primary"
              aria-label="add"
              onClick={() => {
                setAddUser(true)
                setOpenFAB(false)
              }}
            >
              <AddIcon />
            </Fab>
          </Box>
          <OptionFAB
            type={selected.tableName}
            onClickReject={() => {
              setOpenInfoModal(true)
              setOpenFAB(false)
            }}
            onClickRemoveUsers={handleOnRemoveUsers}
            onClickApprovePayment={handleOnApprovePayment}
            onClickRejectPayment={handleOnRejectPayment}
            allowPayment={allowPayment}
            onClickApproveNewUser={approveNewUser}
          />
        </Box>
      </FloatingMenu>
      <AddUserModal
        onClose={() => setAddUser(false)}
        onSubmit={handleOnSubmitAddUser}
        t={t}
        open={openAddUser}
      />
      <Modal open={open} setOpen={handleOnClose}>
        <Box className={classes.timeline}>
          <Box className={classes.secondayBar} position="sticky">
            <IconButton aria-label="Back" onClick={() => setOpen(false)}>
              <KeyboardBackspaceIcon />
            </IconButton>
            <Typography className={classes.secondayTitle}>
              {currentReferral?.invitee} by {currentReferral?.referrer}
            </Typography>
          </Box>
          <Box className={classes.bodySecondary}>
            <Box>
              <Typography className={classes.timelineTitle}>
                {t('timelimeTitle')}
              </Typography>
              <CustomizedTimeline items={currentReferral?.history} />
              {currentReferral?.statusId ===
                affiliateUtil.REFERRAL_STATUS[
                  affiliateUtil.REFERRAL_STATUS_IDS.PENDING_PAYMENT
                ] && (
                <Box className={classes.modalFooter}>
                  <Typography>{t('approvePayment')}</Typography>
                  <Box className={classes.modalBtnWrapper}>
                    <Button
                      variant="contained"
                      onClick={handleOnRejectPayment}
                      className={clsx(classes.timelineBtn, classes.reject)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleOnApprovePayment}
                      className={classes.timelineBtn}
                    >
                      Yes
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {currentReferral?.statusId ===
              affiliateUtil.REFERRAL_STATUS[
                affiliateUtil.REFERRAL_STATUS_IDS.PENDING_KYC_VERIFICATION
              ] && (
              <Box className={classes.modalFooter}>
                <Typography>{t('approveKYC')}</Typography>
                <Box className={classes.modalBtnWrapper}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOnApproveKyc}
                    className={classes.timelineBtn}
                  >
                    Yes
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
      <Modal open={openInfoModal} setOpen={setOpenInfoModal}>
        <Box className={classes.rejectModal}>
          <Typography className={classes.text}>
            {`${t('rejectUserMessage')} ${getAccountName()}`}
          </Typography>
          <Box className={classes.btnAddAccount}>
            <Button onClick={() => setOpenInfoModal(false)}>
              {t('cancel')}
            </Button>
            <Button color="primary" onClick={deleteNewUsers}>
              {loadingDelete ? (
                <CircularProgress color="primary" size={24} />
              ) : (
                t('reject')
              )}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default Admin
