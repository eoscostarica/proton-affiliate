import React from 'react'
import PropTypes from 'prop-types'

const DollarSvg = ({ color = '#582ACB' }) => {
  return (
    <svg width="24" height="24" fill="none">
      <path
        d="M14.474 15.786c0-.596-.187-1.087-.561-1.473-.374-.392-.998-.743-1.871-1.051-.874-.316-1.553-.607-2.038-.873-1.615-.876-2.422-2.173-2.422-3.89 0-1.164.35-2.121 1.05-2.871.7-.75 1.65-1.195 2.848-1.336V2h1.663v2.313c1.206.176 2.138.694 2.797 1.557.658.855.987 1.97.987 3.343h-2.515c0-.883-.198-1.577-.593-2.082-.388-.511-.918-.767-1.59-.767-.666 0-1.185.182-1.56.547-.374.364-.56.886-.56 1.566 0 .61.183 1.101.55 1.473.374.364 1.005.711 1.892 1.04.887.33 1.583.635 2.09.915.505.28.931.603 1.278.968.346.357.613.77.8 1.24.187.47.281 1.02.281 1.652 0 1.184-.36 2.145-1.081 2.88-.714.737-1.712 1.171-2.994 1.305V22h-1.653v-2.04c-1.372-.154-2.429-.652-3.17-1.493C7.367 17.626 7 16.51 7 15.123h2.526c0 .883.218 1.567.655 2.05.443.484 1.067.726 1.871.726.79 0 1.39-.193 1.798-.578.416-.386.624-.898.624-1.536z"
        fill={color}
      />
    </svg>
  )
}

DollarSvg.propTypes = {
  color: PropTypes.string
}

export default DollarSvg
