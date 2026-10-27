import { STATUS_BADGE_CONFIG } from '../constants/statuses.js';
import React from 'react';
import { Chip } from '@mui/material';

export default function StatusBadge({status,size='small'}){const [color,label]=STATUS_BADGE_CONFIG[status]||['default',status];return <Chip size={size} color={color} label={label} variant={color==='default'?'outlined':'filled'}/>}
