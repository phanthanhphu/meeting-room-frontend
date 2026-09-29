import React from 'react';
import { Chip } from '@mui/material';
const config={PENDING:['warning','Pending'],APPROVED:['success','Approved'],REJECTED:['error','Rejected'],CANCELLED:['default','Cancelled'],COMPLETED:['info','Completed'],AVAILABLE:['success','Available'],MAINTENANCE:['warning','Maintenance'],DISABLED:['default','Disabled']};
export default function StatusBadge({status,size='small'}){const [color,label]=config[status]||['default',status];return <Chip size={size} color={color} label={label} variant={color==='default'?'outlined':'filled'}/>}
