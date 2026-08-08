interface TabItem {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={`tab${active === item.key ? ' is-active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count != null ? <span className="tag-count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
