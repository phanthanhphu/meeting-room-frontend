import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import ArrowDropUpOutlined from '@mui/icons-material/ArrowDropUpOutlined';
import ArrowDropDownOutlined from '@mui/icons-material/ArrowDropDownOutlined';
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined';

const textValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true active enabled' : 'false disabled inactive';
  return String(value);
};

export default function DataTable({
  columns,
  rows,
  getKey = (row, index) => row.id || index,
  searchable = true,
  searchFields = [],
  filters = [],
  pageSizeOptions = [5, 10, 20, 50],
  initialPageSize = 10,
  toolbarRight,
  dense = true
}) {
  const [draftSearchValues, setDraftSearchValues] = useState({});
  const [appliedSearchValues, setAppliedSearchValues] = useState({});
  const [draftFilterValues, setDraftFilterValues] = useState({});
  const [appliedFilterValues, setAppliedFilterValues] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);

  const effectiveSearchFields = useMemo(() => {
    if (!searchable) return [];
    if (searchFields.length) return searchFields;
    return columns
      .filter((column) => column.key !== 'actions' && !['status', 'active', 'role'].includes(column.key))
      .slice(0, 4)
      .map((column) => ({ key: column.key, label: column.label }));
  }, [columns, searchable, searchFields]);

  const effectiveFilters = useMemo(() => {
    if (filters.length) return filters;
    if (!searchable) return [];
    const statusColumn = columns.find((column) => ['status', 'role', 'department', 'active'].includes(column.key));
    if (!statusColumn) return [];
    const values = [...new Set(rows.map((row) => textValue(row[statusColumn.key])).filter(Boolean))];
    return values.length > 1 ? [{ key: statusColumn.key, label: statusColumn.label, options: values }] : [];
  }, [columns, filters, rows, searchable]);

  const filteredRows = useMemo(() => {
    let result = rows.filter((row) => {
      const matchesSearch = effectiveSearchFields.every((field) => {
        const query = textValue(appliedSearchValues[field.key]).trim().toLowerCase();
        return !query || textValue(row[field.key]).toLowerCase().includes(query);
      });
      const matchesFilters = effectiveFilters.every((filter) => {
        const selected = appliedFilterValues[filter.key];
        return !selected || textValue(row[filter.key]) === textValue(selected);
      });
      return matchesSearch && matchesFilters;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const left = a[sortKey];
        const right = b[sortKey];
        const numericLeft = Number(left);
        const numericRight = Number(right);
        let comparison;
        if (left !== '' && right !== '' && !Number.isNaN(numericLeft) && !Number.isNaN(numericRight)) comparison = numericLeft - numericRight;
        else comparison = textValue(left).localeCompare(textValue(right), undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return result;
  }, [rows, effectiveSearchFields, appliedSearchValues, effectiveFilters, appliedFilterValues, sortKey, sortDirection]);

  const visibleRows = useMemo(() => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredRows, page, rowsPerPage]);

  const applySearch = () => {
    setAppliedSearchValues({ ...draftSearchValues });
    setAppliedFilterValues({ ...draftFilterValues });
    setPage(0);
  };

  const resetSearch = () => {
    setDraftSearchValues({});
    setAppliedSearchValues({});
    setDraftFilterValues({});
    setAppliedFilterValues({});
    setPage(0);
  };

  const requestSort = (column) => {
    if (column.sortable === false || column.key === 'actions') return;
    if (sortKey === column.key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(column.key);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const sortIcon = (column) => {
    if (column.sortable === false || column.key === 'actions') return null;
    if (sortKey !== column.key) return <UnfoldMoreOutlined sx={{ fontSize: 15, color: '#9AABBC' }} />;
    return sortDirection === 'asc'
      ? <ArrowDropUpOutlined sx={{ fontSize: 18, color: '#4680FF' }} />
      : <ArrowDropDownOutlined sx={{ fontSize: 18, color: '#4680FF' }} />;
  };

  const hasSearchToolbar = effectiveSearchFields.length || effectiveFilters.length || toolbarRight;

  return (
    <Box>
      {hasSearchToolbar && (
        <Stack spacing={1} sx={{ px: 1.25, py: 1.1, borderBottom: '1px solid #DFE7EF', bgcolor: '#FFFFFF' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} sx={{ flexWrap: 'wrap' }}>
            {effectiveSearchFields.map((field) => (
              <TextField
                key={field.key}
                size="small"
                label={field.label}
                value={draftSearchValues[field.key] || ''}
                onChange={(event) => setDraftSearchValues((current) => ({ ...current, [field.key]: event.target.value }))}
                onKeyDown={(event) => { if (event.key === 'Enter') applySearch(); }}
                sx={{ width: { xs: '100%', sm: field.width || 180 }, '& .MuiOutlinedInput-root': { height: 36, bgcolor: '#FFF' }, '& .MuiInputLabel-root': { fontSize: '.72rem' } }}
              />
            ))}
            {effectiveFilters.map((filter) => (
              <FormControl size="small" key={filter.key} sx={{ minWidth: filter.width || 155 }}>
                <Select
                  displayEmpty
                  value={draftFilterValues[filter.key] || ''}
                  onChange={(event) => setDraftFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))}
                  sx={{ height: 36, bgcolor: '#FFF', fontSize: '.72rem' }}
                >
                  <MenuItem value="">All {filter.label}</MenuItem>
                  {(filter.options || []).map((option) => {
                    const value = typeof option === 'object' ? option.value : option;
                    const label = typeof option === 'object' ? option.label : option;
                    return <MenuItem value={value} key={value}>{label}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            ))}
            {(effectiveSearchFields.length > 0 || effectiveFilters.length > 0) && <>
              <Button size="small" variant="contained" startIcon={<SearchOutlined />} onClick={applySearch} sx={{ height: 36, px: 1.6 }}>Search</Button>
              <Button size="small" variant="outlined" startIcon={<RestartAltOutlined />} onClick={resetSearch} sx={{ height: 36, px: 1.4 }}>Reset Search</Button>
            </>}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
            <Typography sx={{ fontSize: '.68rem', color: '#71849A', whiteSpace: 'nowrap' }}>{filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}</Typography>
            {toolbarRight}
          </Stack>
        </Stack>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 850, borderCollapse: 'separate', borderSpacing: 0, borderLeft: '1px solid #DFE7EF', borderTop: '1px solid #DFE7EF' }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 58, whiteSpace: 'nowrap', borderRight: '1px solid #DFE7EF !important', borderBottom: '1px solid #D7E1EB !important', py: .9, fontWeight: 800 }}>No.</TableCell>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  onClick={() => requestSort(column)}
                  sx={{
                    whiteSpace: 'nowrap',
                    cursor: column.sortable === false || column.key === 'actions' ? 'default' : 'pointer',
                    userSelect: 'none',
                    borderRight: '1px solid #DFE7EF !important',
                    borderBottom: '1px solid #D7E1EB !important',
                    py: .9
                  }}
                >
                  <Stack direction="row" spacing={0.25} alignItems="center" justifyContent={column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start'}>
                    <span>{column.label}</span>
                    <Tooltip title={column.sortable === false || column.key === 'actions' ? '' : 'Sort'}>{sortIcon(column) || <span />}</Tooltip>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, index) => (
              <TableRow key={getKey(row, page * rowsPerPage + index)} hover>
                <TableCell align="center" sx={{ width: 58, borderRight: '1px solid #E2E9F0 !important', borderBottom: '1px solid #E2E9F0 !important', py: .78, bgcolor: '#FFF', fontWeight: 700, color: '#61758B' }}>{page * rowsPerPage + index + 1}</TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ borderRight: '1px solid #E2E9F0 !important', borderBottom: '1px solid #E2E9F0 !important', py: .78, bgcolor: '#FFF' }}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!visibleRows.length && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} sx={{ borderRight: '1px solid #E2E9F0 !important', borderBottom: '1px solid #E2E9F0 !important' }}>
                  <Box sx={{ py: 4.5, textAlign: 'center' }}><Typography color="text.secondary" sx={{ fontSize: '.76rem' }}>No matching data</Typography></Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={Math.min(page, Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1))}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
        rowsPerPageOptions={pageSizeOptions}
        labelRowsPerPage="Rows per page"
        sx={{ borderTop: '1px solid #E3EAF1', bgcolor: '#FBFCFE', '& .MuiTablePagination-toolbar': { minHeight: 46 }, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '.7rem' } }}
      />
    </Box>
  );
}
