import React from 'react';
import Badge from '../ui/Badge';
import {
  HiOutlinePhone,
  HiOutlinePhoneArrowUpRight,
  HiOutlinePhoneXMark,
  HiArrowPath,
} from 'react-icons/hi2';

const CallStatusBadge = ({ status }) => {
  const formatStatus = (s) => {
    if (!s) return 'None';
    return s.replace(/-/g, ' ');
  };

  const getBadgeDetails = (s) => {
    const raw = s ? s.toLowerCase() : 'none';

    switch (raw) {
      case 'none':
        return { variant: 'default', icon: null };
      case 'initiated':
        return { variant: 'info', icon: HiArrowPath, className: 'animate-spin' };
      case 'ringing':
        return { variant: 'warning', icon: HiOutlinePhone, className: 'animate-pulse' };
      case 'in-progress':
      case 'answered':
        return { variant: 'primary', icon: HiOutlinePhone, className: 'animate-pulse' };
      case 'completed':
        return { variant: 'success', icon: HiOutlinePhoneArrowUpRight };
      case 'failed':
      case 'no-answer':
      case 'busy':
        return { variant: 'danger', icon: HiOutlinePhoneXMark };
      default:
        return { variant: 'default', icon: null };
    }
  };

  const { variant, icon: Icon, className = '' } = getBadgeDetails(status);

  return (
    <Badge variant={variant}>
      {Icon && <Icon className={`w-3.5 h-3.5 ${className}`} />}
      <span>{formatStatus(status)}</span>
    </Badge>
  );
};

export default CallStatusBadge;
