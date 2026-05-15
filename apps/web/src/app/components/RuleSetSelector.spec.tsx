import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RuleSetSelector } from './RuleSetSelector';
import { conwayRules, highLifeRules } from '@conways-game-of-life/sim';

describe('RuleSetSelector', () => {
  let onChange: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
  });

  it('renders the current rule set name', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    expect(screen.getByText(conwayRules.name)).toBeTruthy();
  });

  it('is closed by default', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens the dropdown on click', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rule set/i }));
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('lists all preset rule sets when open', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rule set/i }));
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('marks the current selection as aria-selected', () => {
    render(<RuleSetSelector value={highLifeRules} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rule set/i }));
    const selected = screen
      .getAllByRole('option')
      .find((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toBeTruthy();
    expect(selected?.textContent?.trim()).toContain(highLifeRules.name);
  });

  it('calls onChange with the chosen rule set and closes on click', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rule set/i }));
    fireEvent.click(screen.getByText(highLifeRules.name));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(highLifeRules);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('sets aria-expanded correctly as dropdown opens and closes', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape key without calling onChange', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens on ArrowDown and sets aria-activedescendant to the current selection', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      `ruleset-option-${conwayRules.id}`,
    );
  });

  it('ArrowDown cycles virtual focus and Enter confirms selection', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open → activeIndex = 0 (conway)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // activeIndex = 1 (highlife)
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(highLifeRules);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('ArrowUp wraps from first option to last', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open → activeIndex = 0
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });   // wraps → activeIndex = 1 (highlife)
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(highLifeRules);
  });

  it('Home/End jump to first and last options', () => {
    render(<RuleSetSelector value={highLifeRules} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open → activeIndex = 1 (highlife)
    fireEvent.keyDown(trigger, { key: 'Home' });       // activeIndex = 0 (conway)
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(conwayRules);
  });

  it('does not open and does not call onChange when disabled', () => {
    render(<RuleSetSelector value={conwayRules} onChange={onChange} disabled />);
    const trigger = screen.getByRole('button', { name: /rule set/i });
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
