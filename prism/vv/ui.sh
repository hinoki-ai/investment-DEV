#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ARAMAC UNIFIED UI SYSTEM - v2.0.0
# ═══════════════════════════════════════════════════════════════════════════════
# Standardized box drawing, colors, and margin system for all ARAMAC scripts
# 
# USAGE:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/ui.sh"
#   ui_init "SCRIPT_NAME"
#   ui_header "Script Title" "v1.0.0"
#   ui_box_open
#   ui_info "Your message here"
#   ui_success "Success message"
#   ui_error "Error message"
#   ui_box_close
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail 2>/dev/null || true
IFS=$'
	'

# =============================================================================
# TERMINAL DETECTION
# =============================================================================

TERM_WIDTH=${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}
export TERM_WIDTH

# =============================================================================
# BOX DRAWING CHARACTERS (Unicode by default, fallback to ASCII)
# =============================================================================

# Default to Unicode - most modern terminals support it
UI_USE_UNICODE="${UI_USE_UNICODE:-true}"

# Only disable Unicode if explicitly requested or TERM is dumb
if [[ -n "${NO_COLOR:-}" ]] || [[ "${TERM:-}" == "dumb" ]]; then
    UI_USE_UNICODE=false
fi

if [[ "$UI_USE_UNICODE" == true ]]; then
    # Unicode box drawing characters
    BOX_TL='╭'; BOX_TR='╮'; BOX_BL='╰'; BOX_BR='╯'
    BOX_H='─'; BOX_V='│'
    BOX_TJ='├'; BOX_TJR='┤'; BOX_TJT='┬'; BOX_TJB='┴'; BOX_CROSS='┼'
    BOX_DH='═'; BOX_DV='║'
    BOX_DTL='╔'; BOX_DTR='╗'; BOX_DBL='╚'; BOX_DBR='╝'
    ICON_OK='✓'; ICON_WARN='▲'; ICON_ERROR='✖'; ICON_INFO='→'; ICON_BULLET='•'
else
    # ASCII fallback
    BOX_TL='+'; BOX_TR='+'; BOX_BL='+'; BOX_BR='+'
    BOX_H='-'; BOX_V='|'
    BOX_TJ='+'; BOX_TJR='+'; BOX_TJT='+'; BOX_TJB='+'; BOX_CROSS='+'
    BOX_DH='='; BOX_DV='|'
    BOX_DTL='+'; BOX_DTR='+'; BOX_DBL='+'; BOX_DBR='+'
    ICON_OK='[OK]'; ICON_WARN='[!]'; ICON_ERROR='[ERR]'; ICON_INFO='>'; ICON_BULLET='*'
fi

export BOX_TL BOX_TR BOX_BL BOX_BR BOX_H BOX_V
export BOX_TJ BOX_TJR BOX_TJT BOX_TJB BOX_CROSS
export BOX_DH BOX_DV BOX_DTL BOX_DTR BOX_DBL BOX_DBR
export ICON_OK ICON_WARN ICON_ERROR ICON_INFO ICON_BULLET

# =============================================================================
# COLOR SYSTEM
# =============================================================================

ui_init_colors() {
    # Respect NO_COLOR environment variable
    if [[ -n "${NO_COLOR:-}" ]]; then
        C_PRIMARY=''; C_SECONDARY=''; C_ACCENT=''
        C_SUCCESS=''; C_SUCCESS_BRIGHT=''; C_ERROR=''; C_ERROR_BRIGHT=''
        C_WARN=''; C_WARNING=''; C_INFO=''; C_NOTE=''; C_HIGHLIGHT=''
        C_MUTED=''; C_DIM=''; C_TEXT=''; C_TEXT_MUTED=''; C_BORDER=''
        C_PEACH=''
        C_LAVENDER=''
        NC=''
        return 0
    fi

    local ESC=$'\033'
    NC="${ESC}[0m"
    
    # Core ARAMAC brand colors (256-color terminal)
    C_PRIMARY="${ESC}[38;5;208m"        # Orange
    C_SECONDARY="${ESC}[38;5;110m"      # Teal
    C_ACCENT="${ESC}[38;5;117m"         # Light blue
    
    C_SUCCESS="${ESC}[38;5;71m"         # Green
    C_SUCCESS_BRIGHT="${ESC}[38;5;82m"  # Bright green
    C_ERROR="${ESC}[38;5;203m"          # Red
    C_ERROR_BRIGHT="${ESC}[38;5;196m"   # Bright red
    C_WARN="${ESC}[38;5;178m"           # Yellow/amber
    C_WARNING="${ESC}[38;5;178m"
    C_INFO="${ESC}[38;5;117m"           # Info blue
    C_NOTE="${ESC}[38;5;180m"           # Tan/beige
    C_HIGHLIGHT="${ESC}[38;5;220m"      # Yellow highlight
    
    C_MUTED="${ESC}[38;5;246m"          # Gray
    C_DIM="${ESC}[38;5;244m"
    C_TEXT="${ESC}[38;5;252m"           # Near-white text
    C_TEXT_MUTED="${ESC}[38;5;246m"
    C_BORDER="${ESC}[38;5;240m"         # Border gray
    C_PEACH="${ESC}[38;5;216m"          # Peach
    C_LAVENDER="${ESC}[38;5;183m"       # Lavender (for version numbers)
    
    export C_PRIMARY C_SECONDARY C_ACCENT C_SUCCESS C_SUCCESS_BRIGHT
    export C_ERROR C_ERROR_BRIGHT C_WARN C_WARNING C_INFO C_NOTE C_HIGHLIGHT
    export C_MUTED C_DIM C_TEXT C_TEXT_MUTED C_BORDER C_PEACH C_LAVENDER NC
}

# =============================================================================
# CORE UI FUNCTIONS
# =============================================================================

# Initialize the UI system - MUST be called first
ui_init() {
    local script_name="${1:-ARAMAC}"
    ui_init_colors
    TERM_WIDTH=${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}
    export TERM_WIDTH
    export UI_SCRIPT_NAME="$script_name"
}

# Truncate text to fit within width (ANSI-aware)
ui_truncate() {
    local width="$1"
    local text="$2"
    
    if [[ "$UI_USE_UNICODE" == true ]]; then
        python3 -c "
import sys, re
w = int(sys.argv[1])
text = sys.argv[2]
ansi = re.compile(r'\x1B\[[0-9;?]*[ -/]*[@-~]')
parts = ansi.split(text)
codes = ansi.findall(text)
out = []
vis = 0
for i, seg in enumerate(parts):
    for ch in seg:
        if vis >= w:
            break
        out.append(ch)
        vis += 1
    if vis >= w:
        break
    if i < len(codes):
        out.append(codes[i])
print(''.join(out) + '\x1b[0m')
" "$width" "$text" 2>/dev/null || echo "$text"
    else
        echo "$text" | cut -c1-"$width"
    fi
}

# Repeat a character N times (UTF-8 safe)
ui_repeat() {
    local char="$1"
    local count="$2"
    local result=""
    for ((i=0; i<count; i++)); do
        result+="$char"
    done
    echo -n "$result"
}

# Calculate visible width (excluding ANSI codes)
ui_visible_width() {
    local text="$1"
    printf '%s' "$text" | sed 's/\x1B\[[0-9;]*[a-zA-Z]//g' | wc -m | tr -d ' '
}

# =============================================================================
# BOX DRAWING FUNCTIONS
# =============================================================================

# Draw top border of a box
ui_box_top() {
    local style="${1:-single}"
    local title="${2:-}"
    local tl h tr
    
    if [[ "$style" == "double" ]]; then
        tl="$BOX_DTL"; h="$BOX_DH"; tr="$BOX_DTR"
    else
        tl="$BOX_TL"; h="$BOX_H"; tr="$BOX_TR"
    fi
    
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    
    if [[ -n "$title" ]]; then
        local title_len
        title_len=$(ui_visible_width "$title")
        # Layout: tl(1) + left_rule(2) + space(1) + title + space(1) + right_rule + tr(1) = TERM_WIDTH
        # Inner width (between corners): left_rule(2) + space(1) + title + space(1) + right_rule = rule_len
        # So: right_rule = rule_len - 4 - title_len
        local pad_right=$(( rule_len - title_len - 4 ))
        (( pad_right < 0 )) && pad_right=0
        
        local left_rule right_rule
        left_rule=$(ui_repeat "$h" 2)
        right_rule=$(ui_repeat "$h" $pad_right)
        
        # Format: ╭── Title ────────────────╮
        local line="${C_PRIMARY}${tl}${left_rule}${NC} ${C_TEXT}${title}${NC} ${C_PRIMARY}${right_rule}${tr}${NC}"
        printf '%s\n' "$line"
    else
        local rule
        rule=$(ui_repeat "$h" $rule_len)
        printf '%s%s%s%s\n' "${C_PRIMARY}${tl}" "$rule" "${tr}${NC}"
    fi
}

# Draw bottom border of a box
ui_box_bottom() {
    local style="${1:-single}"
    local bl h br
    
    if [[ "$style" == "double" ]]; then
        bl="$BOX_DBL"; h="$BOX_DH"; br="$BOX_DBR"
    else
        bl="$BOX_BL"; h="$BOX_H"; br="$BOX_BR"
    fi
    
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    
    local rule
    rule=$(ui_repeat "$h" $rule_len)
    printf '%s%s%s\n' "${C_PRIMARY}${bl}" "$rule" "${br}${NC}"
}

# Draw a content line inside a box (with left margin)
ui_box_line() {
    local text="$1"
    local first="${2:-false}"
    local v="$BOX_V"
    local tj="$BOX_TJ"
    
    # Inner width: TERM_WIDTH - 2 (borders) - 4 (2 spaces each side) = TERM_WIDTH - 6
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    
    local out
    out=$(ui_truncate "$cw" "$text")
    
    # Consistent 2-space padding after border character, pad to full width
    local border="$v"
    [[ "$first" == "true" ]] && border="$tj"
    
    # Pad with spaces to fill the line width (content width + padding = full width)
    local visible_len
    visible_len=$(ui_visible_width "$out")
    local padding=$(( cw - visible_len ))
    (( padding < 0 )) && padding=0
    
    # Build complete line: left border + 2 spaces + content + padding + 2 spaces + right border
    local padding_spaces=$(ui_repeat ' ' $padding)
    
    printf '%s  %s%s  %s\n' "${C_PRIMARY}${border}${NC}" "$out" "$padding_spaces" "${C_PRIMARY}${v}${NC}"
    
    # Reset first line flag after printing
    UI_FIRST_LINE=false
}

# Draw a centered content line inside a box
ui_box_line_centered() {
    local text="$1"
    local first="${2:-false}"
    local v="$BOX_V"
    local tj="$BOX_TJ"
    
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    
    local visible_len=$(ui_visible_width "$text")
    local total_padding=$(( cw - visible_len ))
    local left_pad=$(( total_padding / 2 ))
    local right_pad=$(( total_padding - left_pad ))
    (( left_pad < 0 )) && left_pad=0
    (( right_pad < 0 )) && right_pad=0
    
    local left_spaces=$(ui_repeat ' ' $left_pad)
    local right_spaces=$(ui_repeat ' ' $right_pad)
    
    local border="$v"
    [[ "$first" == "true" ]] && border="$tj"
    
    printf '%s  %s%s%s  %s\n' "${C_PRIMARY}${border}${NC}" "$left_spaces" "$text" "$right_spaces" "${C_PRIMARY}${v}${NC}"
    
    UI_FIRST_LINE=false
}

# Open a box (draw top border)
# Usage: ui_box_open [title] [title_color]
# title_color is optional, defaults to C_TEXT
ui_box_open() {
    local title="${1:-}"
    local title_color="${2:-$C_TEXT}"
    
    local style="single"
    local tl h tr
    
    tl="$BOX_TL"; h="$BOX_H"; tr="$BOX_TR"
    
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    
    if [[ -n "$title" ]]; then
        local title_len
        title_len=$(ui_visible_width "$title")
        local pad_right=$(( rule_len - title_len - 4 ))
        (( pad_right < 0 )) && pad_right=0
        
        local left_rule right_rule
        left_rule=$(ui_repeat "$h" 2)
        right_rule=$(ui_repeat "$h" $pad_right)
        
        # Format: ╭── Title ────────────────╮ with custom title color
        local line="${C_PRIMARY}${tl}${left_rule}${NC} ${title_color}${title}${NC} ${C_PRIMARY}${right_rule}${tr}${NC}"
        printf '%s\n' "$line"
    else
        local rule
        rule=$(ui_repeat "$h" $rule_len)
        printf '%s%s%s\n' "${C_PRIMARY}${tl}" "$rule" "${tr}${NC}"
    fi
}

# Close a box (draw bottom border)
ui_box_close() {
    ui_box_bottom "single"
}

# =============================================================================
# SEGMENTED PANEL SYSTEM (Connected boxes with shared borders)
# =============================================================================

# Start a segmented panel group
# Usage: ui_segment_open [title] [title_color]
ui_segment_open() {
    local title="${1:-}"
    local title_color="${2:-$C_TEXT}"
    
    export UI_IN_SEGMENT=true
    
    # Draw top border
    local tl="$BOX_TL"; local h="$BOX_H"; local tr="$BOX_TR"
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    
    if [[ -n "$title" ]]; then
        local title_len
        title_len=$(ui_visible_width "$title")
        local pad_right=$(( rule_len - title_len - 4 ))
        (( pad_right < 0 )) && pad_right=0
        
        local left_rule=$(ui_repeat "$h" 2)
        local right_rule=$(ui_repeat "$h" $pad_right)
        
        printf '%s %s %s\n' \
            "${C_PRIMARY}${tl}${left_rule}${NC}" \
            "${title_color}${title}${NC}" \
            "${C_PRIMARY}${right_rule}${tr}${NC}"
    else
        local rule=$(ui_repeat "$h" $rule_len)
        printf '%s%s%s\n' "${C_PRIMARY}${tl}" "$rule" "${tr}${NC}"
    fi
}

# Add a section divider (shared border between segments)
# Usage: ui_segment_divider [title] [title_color]  
ui_segment_divider() {
    local title="${1:-}"
    local title_color="${2:-$C_TEXT}"
    
    local tj="$BOX_TJ"; local h="$BOX_H"; local tjr="$BOX_TJR"
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    
    if [[ -n "$title" ]]; then
        local title_len
        title_len=$(ui_visible_width "$title")
        local pad_right=$(( rule_len - title_len - 4 ))
        (( pad_right < 0 )) && pad_right=0
        
        local left_rule=$(ui_repeat "$h" 2)
        local right_rule=$(ui_repeat "$h" $pad_right)
        
        printf '%s %s %s\n' \
            "${C_PRIMARY}${tj}${left_rule}${NC}" \
            "${title_color}${title}${NC}" \
            "${C_PRIMARY}${right_rule}${tjr}${NC}"
    else
        local rule=$(ui_repeat "$h" $rule_len)
        printf '%s%s%s\n' "${C_PRIMARY}${tj}" "$rule" "${tjr}${NC}"
    fi
}

# Add a centered title with underline below it (not full width)
# Usage: ui_segment_title [title_with_color] [is_first]
# Creates a well shape with continuous top divider:
# ├──────────┬─────────────┬──────────┤  <- for subsequent titles
# ╭──────────┬─────────────┬──────────╮  <- for first title (connects to box top)
# │          │  Title      │          │
# │          └─────────────┘          │
ui_segment_title() {
    local title="${1:-}"
    local is_first="${2:-false}"
    local ul_char="─"
    
    local v="$BOX_V"
    local tj="$BOX_TJ"
    local tjr="$BOX_TJR"
    local h="$BOX_H"
    # Content width: must match ui_box_line content width (TERM_WIDTH - 6)
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    
    # Get visible width (excluding ANSI codes)
    local title_len
    title_len=$(ui_visible_width "$title")
    
    # Well width: 2 spaces + title + 2 spaces
    local well_inner=$(( title_len + 4 ))
    # Content line: │ + 2sp + left_side + │ + 2sp + well_inner + 2sp + │ + right_side + 2sp + │
    # Fixed: 1+2+1+2+2+1+2+1 = 12. Content = 12 + left_side + right_side + well_inner = TERM_WIDTH
    # So left_side + right_side = TERM_WIDTH - 12 - well_inner = cw - 6 - well_inner
    # Since cw = TERM_WIDTH - 6, we need: side_space = cw - well_inner - 6
    # But we also have divider: 4 + left_div + right_div + well_inner = TERM_WIDTH
    # So left_div + right_div = TERM_WIDTH - 4 - well_inner = cw + 2 - well_inner
    # And left_div + right_div = left_side + right_side + 8 (to account for difference in fixed chars)
    # So: cw - well_inner - 6 + 8 = cw + 2 - well_inner ✓
    local side_space=$(( cw - well_inner - 2 ))  # left_side + right_side
    local left_side=$(( side_space / 2 ))
    local right_side=$(( side_space - left_side ))
    (( left_side < 0 )) && left_side=0
    (( right_side < 0 )) && right_side=0
    
    # Divider sides need to be 4 more than content sides (2 on each side)
    local left_div=$(( left_side + 2 ))
    local right_div=$(( right_side + 2 ))
    
    local left_div_str=$(ui_repeat "$h" $left_div)
    local right_div_str=$(ui_repeat "$h" $right_div)
    local left_spaces=$(ui_repeat ' ' $left_side)
    local right_spaces=$(ui_repeat ' ' $right_side)
    local well_inner_line=$(ui_repeat "$h" $well_inner)
    local ul_line=$(ui_repeat "$ul_char" $well_inner)
    local well_padding=$(ui_repeat ' ' 2)
    
    # Line 1: Continuous divider with well top integrated
    # First title uses ╭─┬─┬─╮ to connect to box top
    # Subsequent titles use ├─┬─┬─┤
    # Total width: corner(1) + left_div + 1(┬) + well_inner + 1(┬) + right_div + corner(1) = TERM_WIDTH
    if [[ "$is_first" == "true" ]]; then
        printf '%s%s┬%s┬%s%s\n' \
            "${C_PRIMARY}${BOX_TL}${left_div_str}" \
            "" \
            "$well_inner_line" \
            "" \
            "${right_div_str}${BOX_TR}${NC}"
    else
        printf '%s%s┬%s┬%s%s\n' \
            "${C_PRIMARY}${tj}${left_div_str}" \
            "" \
            "$well_inner_line" \
            "" \
            "${right_div_str}${tjr}${NC}"
    fi
    
    # Line 2: Title inside the well (with │ walls and padding)
    # Structure: │ + 2spaces + left_spaces + │ + 2spaces + title + 2spaces + │ + right_spaces + 2spaces + │
    local line2_left="${C_PRIMARY}${v}${NC}  ${left_spaces}${C_PRIMARY}│${NC}"
    local line2_right="${C_PRIMARY}│${NC}${right_spaces}  ${C_PRIMARY}${v}${NC}"
    printf '%s%s%s%s%s\n' "$line2_left" "$well_padding" "$title" "$well_padding" "$line2_right"
    
    # Line 3: Underline with rounded corners ╰ ╯
    # Structure: │ + 2spaces + left_spaces + ╰ + ul_line + ╯ + right_spaces + 2spaces + │
    local line3_left="${C_PRIMARY}${v}${NC}  ${left_spaces}${C_PRIMARY}"
    local line3_middle="╰${ul_line}╯"
    local line3_right="${NC}${right_spaces}  ${C_PRIMARY}${v}${NC}"
    printf '%s%s%s\n' "$line3_left" "$line3_middle" "$line3_right"
    
    # Reset first line flag so content lines use │ instead of ├
    UI_FIRST_LINE=false
}

# Close a segmented panel group
ui_segment_close() {
    export UI_IN_SEGMENT=false
    ui_box_bottom "single"
}

# Draw a section divider inside a box
ui_box_section() {
    local title="${1:-}"
    local h="$BOX_H"
    local tjr="$BOX_TJR"
    
    local rule_len=$(( TERM_WIDTH - 4 ))
    (( rule_len < 1 )) && rule_len=1
    
    if [[ -n "$title" ]]; then
        local title_len=${#title}
        local pad_right=$(( rule_len - title_len - 2 ))
        (( pad_right < 0 )) && pad_right=0
        local right_rule
        right_rule=$(ui_repeat "$h" $pad_right)
        printf '%s  %s %s%s\n' \
            "${C_PRIMARY}${tjr}${NC}" \
            "${C_MUTED}${title}" \
            "${C_PRIMARY}${right_rule}${NC}" \
            ""
    else
        local rule
        rule=$(ui_repeat "$h" $rule_len)
        printf '%s  %s%s\n' "${C_PRIMARY}${tjr}${NC}" "$rule" "${NC}"
    fi
}

# =============================================================================
# CONTENT HELPERS
# =============================================================================

# Print info line
ui_info() {
    ui_box_line "${C_TEXT}$*" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Print success line
ui_success() {
    ui_box_line "${C_SUCCESS_BRIGHT}${ICON_OK} ${C_TEXT}$*" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Print preflight OK - checkmark bright, label neutral, "OK" green
ui_ok() {
    local label="$1"
    ui_box_line "${C_SUCCESS_BRIGHT}${ICON_OK} ${C_TEXT}${label}: ${C_SUCCESS}OK" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Print warning line
ui_warn() {
    ui_box_line "${C_WARN}${ICON_WARN} ${C_TEXT}$*" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Print error line
ui_error() {
    ui_box_line "${C_ERROR_BRIGHT}${ICON_ERROR} ${C_TEXT}$*" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Print note line
ui_note() {
    ui_box_line "${C_NOTE}${ICON_INFO} ${C_TEXT}$*" "${UI_FIRST_LINE:-false}"
    UI_FIRST_LINE=false
}

# Mark next line as first (for T-junction)
ui_first() {
    UI_FIRST_LINE=true
}

# =============================================================================
# HEADER / FOOTER
# =============================================================================

# Print branded header
ui_header() {
    local title="${1:-${UI_SCRIPT_NAME:-ARAMAC}}"
    local version="${2:-}"
    local subtitle="${3:-}"
    local compact="${4:-false}"
    
    if [[ "$compact" != "true" ]]; then
        echo ""
    fi
    
    # Draw double-line header box
    local dv="$BOX_DV"  # Double vertical
    local dh="$BOX_DH"  # Double horizontal
    local dtl="$BOX_DTL"; local dtr="$BOX_DTR"
    local dbl="$BOX_DBL"; local dbr="$BOX_DBR"
    
    # Top border
    local rule_len=$(( TERM_WIDTH - 2 ))
    (( rule_len < 1 )) && rule_len=1
    local rule=$(ui_repeat "$dh" $rule_len)
    printf '%s%s%s\n' "${C_PRIMARY}${dtl}" "$rule" "${dtr}${NC}"
    
    # Content line (with right border)
    # ΛRΛMΛC = orange, title = purple, version = peach, • = white
    local content="${C_PRIMARY}ΛRΛMΛC${C_TEXT}"
    [[ -n "$title" ]] && content+=" • ${C_BRAND:-$C_PRIMARY}$title"
    [[ -n "$version" ]] && content+="${C_TEXT} • ${C_PEACH}v${version}"
    
    # Same calculation as ui_box_line: TERM_WIDTH - 6 for content + 2 spaces each side
    # Center the content
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    local out=$(ui_truncate "$cw" "$content")
    local visible_len=$(ui_visible_width "$out")
    local total_padding=$(( cw - visible_len ))
    local left_pad=$(( total_padding / 2 ))
    local right_pad=$(( total_padding - left_pad ))
    (( left_pad < 0 )) && left_pad=0
    (( right_pad < 0 )) && right_pad=0
    local left_spaces=$(ui_repeat ' ' $left_pad)
    local right_spaces=$(ui_repeat ' ' $right_pad)
    printf '%s  %s%s%s  %s\n' "${C_PRIMARY}${dv}${NC}" "$left_spaces" "$out" "$right_spaces" "${C_PRIMARY}${dv}${NC}"
    
    # Optional subtitle (with right border) - centered and white
    if [[ -n "$subtitle" ]]; then
        local sub_out=$(ui_truncate "$cw" "${C_TEXT}$subtitle")
        visible_len=$(ui_visible_width "$sub_out")
        local sub_padding=$(( cw - visible_len ))
        local left_pad=$(( sub_padding / 2 ))
        local right_pad=$(( sub_padding - left_pad ))
        (( left_pad < 0 )) && left_pad=0
        (( right_pad < 0 )) && right_pad=0
        local left_spaces=$(ui_repeat ' ' $left_pad)
        local right_spaces=$(ui_repeat ' ' $right_pad)
        printf '%s  %s%s%s  %s\n' "${C_PRIMARY}${dv}${NC}" "$left_spaces" "$sub_out" "$right_spaces" "${C_PRIMARY}${dv}${NC}"
    fi
    
    # Bottom border (double line to close header)
    rule=$(ui_repeat "$dh" $rule_len)
    printf '%s%s%s\n' "${C_PRIMARY}${dbl}" "$rule" "${dbr}${NC}"
    if [[ "$compact" != "true" ]]; then
        echo ""
    fi
}

# Print simple footer
ui_footer() {
    local message="${1:-Complete}"
    ui_box_open
    ui_box_line "${C_SUCCESS_BRIGHT}${ICON_OK} ${C_TEXT}$message" "true"
    ui_box_close
    echo ""
}

# Print status footer with code
ui_status() {
    local code="${1:-0}"
    if [[ "$code" -eq 0 ]]; then
        ui_footer "Success"
    else
        ui_box_open
        ui_box_line "${C_ERROR_BRIGHT}${ICON_ERROR} ${C_TEXT}Failed with code $code" "true"
        ui_box_close
        echo ""
    fi
}

# =============================================================================
# PROGRESS / STATUS
# =============================================================================

# Print a progress step
ui_step() {
    local current="$1"
    local total="$2"
    local message="$3"
    local status="${4:-info}"  # info, success, warn, error
    
    local prefix="[${current}/${total}]"
    case "$status" in
        success) prefix="${C_SUCCESS_BRIGHT}${ICON_OK}${NC}" ;;
        warn)    prefix="${C_WARN}${ICON_WARN}${NC}" ;;
        error)   prefix="${C_ERROR_BRIGHT}${ICON_ERROR}${NC}" ;;
        *)       prefix="${C_INFO}${ICON_INFO}${NC}" ;;
    esac
    
    printf '%s %s\n' "$prefix" "$message"
}

# Print a separator line
ui_separator() {
    local char="${1:-─}"
    local width=$(( TERM_WIDTH - 4 ))
    (( width < 1 )) && width=1
    printf '%s\n' "${C_BORDER}$(printf '%*s' "$width" '' | tr ' ' "$char")${NC}"
}

# =============================================================================
# INPUT HELPERS
# =============================================================================

# Ask yes/no question
ui_confirm() {
    local prompt="$1"
    local default="${2:-Y}"
    
    local opts
    if [[ "$default" == "Y" ]]; then
        opts="[Y/n]"
    else
        opts="[y/N]"
    fi
    
    printf '%s %s: ' "${C_TEXT}${prompt}${NC}" "${C_MUTED}${opts}${NC}"
}

# Read input with prompt
ui_prompt() {
    local prompt="$1"
    printf '%s: ' "${C_TEXT}${prompt}${NC}"
}

# =============================================================================
# LEGACY COMPATIBILITY (for older scripts)
# =============================================================================

# These aliases maintain compatibility with existing scripts
ui_print_header() { ui_header "$@"; }
ui_draw_box() { 
    local title="$1"
    ui_box_open "$title"
}
ui_margin_init() { ui_init "$@"; }
ui_detect_unicode() { :; }  # No-op, handled in init

# =============================================================================
# SPINNER / LOADER
# =============================================================================

# Braille spinner frames
UI_SPINNER_FRAMES=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)
UI_SPINNER_IDX=0

# Get next spinner frame (prints to stdout, updates index)
# NOTE: This uses a temp file to work around subshell limitation with $()
ui_spinner_next() {
    local frame="${UI_SPINNER_FRAMES[$UI_SPINNER_IDX]}"
    UI_SPINNER_IDX=$(( (UI_SPINNER_IDX + 1) % ${#UI_SPINNER_FRAMES[@]} ))
    printf '%s' "$frame"
}

# Reset spinner
ui_spinner_reset() {
    UI_SPINNER_IDX=0
}

# Advance spinner and return frame via global variable (avoids subshell issues)
# Usage: ui_spinner_advance; frame="$UI_CURRENT_FRAME"
ui_spinner_advance() {
    UI_CURRENT_FRAME="${UI_SPINNER_FRAMES[$UI_SPINNER_IDX]}"
    UI_SPINNER_IDX=$(( (UI_SPINNER_IDX + 1) % ${#UI_SPINNER_FRAMES[@]} ))
}

# Clear to end of line (ANSI escape sequence)
ui_clear_eol() {
    printf '\033[K'
}

# Draw a spinner line inside a box (follows ui_box_line pattern)
# Usage: ui_spinner_line <frame> <message>
ui_spinner_line() {
    local frame="$1"
    local message="$2"
    local v="$BOX_V"
    
    # Match ui_box_line: content width = TERM_WIDTH - 6 (borders + 2 spaces each side)
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    
    # Build content: spinner frame + space + message
    local content="${frame} ${message}"
    local visible_len
    visible_len=$(ui_visible_width "$content")
    
    # Pad to fill the line width (prevents artifacts when replacing)
    local padding=$(( cw - visible_len ))
    (( padding < 0 )) && padding=0
    local padding_spaces=$(ui_repeat ' ' $padding)
    
    # Output: \r to return to start, then full line with clear-to-eol
    printf '\r%s  %s%s  %s' "${C_PRIMARY}${v}${NC}" "$content" "$padding_spaces" "${C_PRIMARY}${v}${NC}"
    ui_clear_eol
}

# Draw a result line inside a box (replaces spinner)
# Usage: ui_spinner_result <icon> <icon_color> <message> <message_color>
ui_spinner_result() {
    local icon="$1"
    local icon_color="$2"
    local message="$3"
    local message_color="${4:-$C_TEXT}"
    local v="$BOX_V"
    
    # Match ui_box_line: content width = TERM_WIDTH - 6
    local cw=$(( TERM_WIDTH - 6 ))
    (( cw < 1 )) && cw=1
    
    # Build content: icon + space + message
    local content="${icon} ${message}"
    local visible_len
    visible_len=$(ui_visible_width "$content")
    
    # Pad to fill the line width
    local padding=$(( cw - visible_len ))
    (( padding < 0 )) && padding=0
    local padding_spaces=$(ui_repeat ' ' $padding)
    
    # Output: colored icon, message, padding, and border
    printf '\r%s  %s%s%s  %s\n' "${C_PRIMARY}${v}${NC}" "${icon_color}${icon}${NC} ${message_color}" "$message" "$padding_spaces" "${C_PRIMARY}${v}${NC}"
}
