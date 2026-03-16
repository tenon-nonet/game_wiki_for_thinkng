import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  NodeResizer,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getBosses, getNpcs, getGame, getRelationGraph, saveRelationGraph } from '../api'
import { isAdmin } from '../auth'
import type { Boss, Game, Npc } from '../types'

// ---- ノード型定義 ----
type CharacterNodeData = {
  entityType: 'BOSS' | 'NPC'
  entityId: number
  name: string
  imagePath: string | null
}
type CharacterNodeType = Node<CharacterNodeData, 'character'>

type OrgNodeData = {
  name: string
  bgColor: string
  borderColor: string
}
type OrgNodeType = Node<OrgNodeData, 'organization'>

type AppNode = CharacterNodeType | OrgNodeType

// ---- 組織カラープリセット ----
const ORG_COLORS = [
  { label: '赤',  bg: 'rgba(70,20,20,0.30)',   border: '#6b2a2a' },
  { label: '青',  bg: 'rgba(20,38,70,0.30)',   border: '#2a4060' },
  { label: '緑',  bg: 'rgba(20,48,32,0.30)',   border: '#2a5038' },
  { label: '紫',  bg: 'rgba(48,22,65,0.30)',   border: '#472560' },
  { label: '金',  bg: 'rgba(65,48,15,0.30)',   border: '#584020' },
]

// ---- キャラクターノード ----
function CharacterNode({ data }: NodeProps<CharacterNodeType>) {
  const navigate = useNavigate()
  const borderColor = data.entityType === 'BOSS' ? 'border-red-900' : 'border-slate-600'
  const tagBg = data.entityType === 'BOSS' ? 'bg-red-950/80 text-red-400/80' : 'bg-slate-800 text-slate-400'
  const path = data.entityType === 'BOSS' ? 'bosses' : 'npcs'

  return (
    <div className={`bg-zinc-800 border-2 ${borderColor} rounded-lg w-28 overflow-hidden shadow-lg select-none`}>
      <Handle id="top"     type="target" position={Position.Top}    className="!bg-zinc-600 !w-2.5 !h-2.5" />
      <Handle id="left-t"  type="target" position={Position.Left}   className="!bg-zinc-600 !w-2.5 !h-2.5" />
      <Handle id="right-t" type="target" position={Position.Right}  className="!bg-zinc-600 !w-2.5 !h-2.5" />
      {data.imagePath ? (
        <img src={`/uploads/${data.imagePath}`} alt={data.name} className="w-full h-20 object-cover" />
      ) : (
        <div className="w-full h-20 bg-zinc-700 flex items-center justify-center text-3xl">
          {data.entityType === 'BOSS' ? '⚔️' : '👤'}
        </div>
      )}
      <div className="p-1.5">
        <p
          className="text-xs text-gray-100 font-medium truncate cursor-pointer hover:text-red-300 transition"
          onClick={() => navigate(`/${path}/${data.entityId}`)}
          title={data.name}
        >
          {data.name}
        </p>
        <span className={`text-xs px-1 py-0.5 rounded ${tagBg}`}>
          {data.entityType === 'BOSS' ? 'ボス' : 'NPC'}
        </span>
      </div>
      <Handle id="bottom"  type="source" position={Position.Bottom} className="!bg-zinc-600 !w-2.5 !h-2.5" />
      <Handle id="left-s"  type="source" position={Position.Left}   className="!bg-zinc-600 !w-2.5 !h-2.5" />
      <Handle id="right-s" type="source" position={Position.Right}  className="!bg-zinc-600 !w-2.5 !h-2.5" />
    </div>
  )
}

// ---- 組織ノード ----
function OrganizationNode({ data, selected }: NodeProps<OrgNodeType>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: data.bgColor,
        border: `2px solid ${data.borderColor}`,
        borderRadius: 8,
        boxSizing: 'border-box',
      }}
    >
      <NodeResizer
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        lineStyle={{ stroke: data.borderColor, strokeWidth: 1 }}
        handleStyle={{ fill: data.borderColor, stroke: data.borderColor, width: 6, height: 6, opacity: 0.7 }}
      />
      <Handle id="org-top"    type="source" position={Position.Top}    className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-bottom" type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-left"   type="source" position={Position.Left}   className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-right"  type="source" position={Position.Right}  className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-top-t"    type="target" position={Position.Top}    className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-bottom-t" type="target" position={Position.Bottom} className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-left-t"   type="target" position={Position.Left}   className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <Handle id="org-right-t"  type="target" position={Position.Right}  className="!w-2.5 !h-2.5 !opacity-60" style={{ background: data.borderColor }} />
      <div
        className="px-2.5 py-1.5 font-bold text-sm select-none"
        style={{ color: data.borderColor, borderBottom: `1px solid ${data.borderColor}40` }}
      >
        {data.name}
      </div>
    </div>
  )
}

const nodeTypes = { character: CharacterNode, organization: OrganizationNode }

// ---- エッジスタイル ----
type LabelType = 'ALLY' | 'ENEMY' | 'CUSTOM'

const PRESET_LABELS: { type: LabelType; label: string; colorClass: string; stroke: string }[] = [
  { type: 'ALLY',  label: '協力', colorClass: 'text-emerald-600', stroke: '#4a7a5a' },
  { type: 'ENEMY', label: '敵対', colorClass: 'text-red-700',     stroke: '#7a3a3a' },
]

function makeEdgeStyle(labelType: LabelType) {
  const color = labelType === 'ALLY' ? '#4a7a5a' : labelType === 'ENEMY' ? '#7a3a3a' : '#5a5a5a'
  return {
    style:        { stroke: color, strokeWidth: 2 },
    labelStyle:   { fill: color, fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.85 },
  }
}

// ---- エディタ本体 ----
function RelationGraphEditor() {
  const { id: gameId } = useParams<{ id: string }>()
  const admin = isAdmin()
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [game, setGame] = useState<Game | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // エッジ作成ダイアログ
  const [pendingConn, setPendingConn] = useState<Connection | null>(null)
  const [customLabel, setCustomLabel] = useState('')

  // エッジ編集ダイアログ
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  // 組織追加ダイアログ
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgColorIdx, setOrgColorIdx] = useState(0)

  useEffect(() => {
    const gid = Number(gameId)
    Promise.all([
      getGame(gid),
      getBosses(gid),
      getNpcs(gid),
      getRelationGraph(gid).catch(() => null),
    ]).then(([gameRes, bossRes, npcRes, graphRes]) => {
      setGame(gameRes.data)
      setBosses(bossRes.data)
      setNpcs(npcRes.data)
      if (graphRes?.data?.graphData) {
        try {
          const parsed = JSON.parse(graphRes.data.graphData)
          // extent: 'parent' は追従バグの原因になるため除去
          const sanitizedNodes = (parsed.nodes ?? []).map((n: AppNode) => ({ ...n, extent: undefined }))
          setNodes(sanitizedNodes)
          setEdges(parsed.edges ?? [])
        } catch (_) { /* 壊れたデータは無視 */ }
      }
    })
  }, [gameId])

  const nodeIdSet = new Set(nodes.map((n) => n.id))

  // ---- キャラクター追加 ----
  const addCharNode = (entityType: 'BOSS' | 'NPC', entity: Boss | Npc) => {
    const nodeId = `${entityType.toLowerCase()}-${entity.id}`
    if (nodeIdSet.has(nodeId)) return
    setNodes((nds) => [
      ...nds,
      {
        id: nodeId,
        type: 'character',
        position: { x: Math.random() * 400 + 80, y: Math.random() * 300 + 80 },
        data: { entityType, entityId: entity.id, name: entity.name, imagePath: entity.imagePath },
      } as CharacterNodeType,
    ])
  }

  // ---- 組織追加 ----
  const addOrgNode = () => {
    if (!orgName.trim()) return
    const color = ORG_COLORS[orgColorIdx]
    setNodes((nds) => [
      // 組織は配列の先頭に追加して、キャラの後ろに描画
      {
        id: `org-${Date.now()}`,
        type: 'organization',
        position: { x: 100, y: 100 },
        style: { width: 280, height: 200 },
        zIndex: -1,
        data: { name: orgName.trim(), bgColor: color.bg, borderColor: color.border },
      } as OrgNodeType,
      ...nds,
    ])
    setShowAddOrg(false)
    setOrgName('')
    setOrgColorIdx(0)
  }

  // ---- キャラを組織に自動所属（ドラッグ停止時）----
  const onNodeDragStop = useCallback((_: React.MouseEvent, draggedNode: Node) => {
    if (draggedNode.type !== 'character') return

    // setNodes の関数形式の中で最新の nds を使うことでステールクローズを回避
    setNodes((nds) => {
      // 最新の nds から親位置を取得して絶対座標を計算
      let absPos = draggedNode.position
      if (draggedNode.parentId) {
        const parent = nds.find((n) => n.id === draggedNode.parentId)
        if (parent) {
          absPos = {
            x: parent.position.x + draggedNode.position.x,
            y: parent.position.y + draggedNode.position.y,
          }
        }
      }

      // 最新の nds から含まれる組織ノードを探す
      const orgNode = nds.find((n) => {
        if (n.type !== 'organization') return false
        const w = typeof n.style?.width === 'number' ? n.style.width : 280
        const h = typeof n.style?.height === 'number' ? n.style.height : 200
        return (
          absPos.x >= n.position.x && absPos.x <= n.position.x + w &&
          absPos.y >= n.position.y && absPos.y <= n.position.y + h
        )
      })

      if (orgNode && orgNode.id !== draggedNode.parentId) {
        // 組織に入る（または別の組織に移動）
        return nds.map((n) =>
          n.id === draggedNode.id
            ? {
                ...n,
                parentId: orgNode.id,
                extent: undefined,
                position: {
                  x: Math.max(0, absPos.x - orgNode.position.x),
                  y: Math.max(0, absPos.y - orgNode.position.y),
                },
              }
            : n
        )
      } else if (!orgNode && draggedNode.parentId) {
        // 組織の外に出た
        return nds.map((n) =>
          n.id === draggedNode.id
            ? { ...n, parentId: undefined, extent: undefined, position: absPos }
            : n
        )
      }

      return nds
    })
  }, [setNodes])

  // ---- 右クリック削除 ----
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    if (node.type === 'organization') {
      // 組織削除：子ノードの parentId を解除して絶対座標に戻す
      setNodes((nds) =>
        nds
          .filter((n) => n.id !== node.id)
          .map((n) => {
            if (n.parentId !== node.id) return n
            return {
              ...n,
              parentId: undefined,
              extent: undefined,
              position: {
                x: node.position.x + n.position.x,
                y: node.position.y + n.position.y,
              },
            }
          })
      )
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id))
    } else {
      setNodes((nds) => nds.filter((n) => n.id !== node.id))
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id))
    }
  }, [setNodes, setEdges])

  // ---- エッジ接続 ----
  const onConnect = useCallback((conn: Connection) => {
    setPendingConn(conn)
    setCustomLabel('')
  }, [])

  const confirmEdge = (labelType: LabelType, label: string) => {
    if (!pendingConn) return
    const s = makeEdgeStyle(labelType)
    setEdges((eds) =>
      addEdge({ ...pendingConn, id: `e-${pendingConn.source}-${pendingConn.target}-${Date.now()}`, type: 'step', label, data: { labelType }, ...s }, eds)
    )
    setPendingConn(null)
  }

  // ---- エッジ編集 ----
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (!admin) return
    setEditingEdgeId(edge.id)
    setEditLabel(typeof edge.label === 'string' ? edge.label : '')
  }, [admin])

  const updateEdgeLabel = (labelType: LabelType, label: string) => {
    const s = makeEdgeStyle(labelType)
    setEdges((eds) =>
      eds.map((e) =>
        e.id === editingEdgeId ? { ...e, type: 'step', label, data: { labelType }, ...s } : e
      )
    )
    setEditingEdgeId(null)
  }

  const deleteEdge = () => {
    setEdges((eds) => eds.filter((e) => e.id !== editingEdgeId))
    setEditingEdgeId(null)
  }

  // ---- パネルからドラッグ ----
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/reactflow')
    if (!raw) return
    const { entityType, entityId, name, imagePath } = JSON.parse(raw) as CharacterNodeData
    const nodeId = `${entityType.toLowerCase()}-${entityId}`
    if (nodeIdSet.has(nodeId)) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodes((nds) => [
      ...nds,
      { id: nodeId, type: 'character', position, data: { entityType, entityId, name, imagePath } } as CharacterNodeType,
    ])
  }, [nodeIdSet, screenToFlowPosition, setNodes])

  // ---- 保存 ----
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveRelationGraph(Number(gameId), JSON.stringify({ nodes, edges }))
      setSaveMsg('保存しました')
      setTimeout(() => setSaveMsg(null), 2500)
    } catch (_) {
      setSaveMsg('保存に失敗しました')
      setTimeout(() => setSaveMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const editingEdge = edges.find((e) => e.id === editingEdgeId)

  return (
    <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ---- 左パネル ---- */}
      {admin && (
        <div className="w-56 bg-zinc-900 border-r border-zinc-700 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-zinc-700">
            <Link to={`/games/${gameId}`} className="text-xs text-gray-400 hover:underline">
              ← {game?.name ?? 'ゲーム詳細'}
            </Link>
            <h2 className="text-sm font-bold text-gray-100 mt-1">キャラクター</h2>
            <p className="text-xs text-gray-500 mt-0.5">クリックまたはドラッグで追加</p>
          </div>

          {/* 組織追加ボタン */}
          <div className="px-2 pt-2 pb-1 border-b border-zinc-700">
            <button
              onClick={() => setShowAddOrg(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-xs text-gray-200 transition"
            >
              <span className="text-base leading-none">＋</span> 組織を追加
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
            {bosses.length > 0 && (
              <>
                <p className="text-xs text-red-400 font-semibold px-1 pt-1 pb-0.5">ボス</p>
                {bosses.map((b) => {
                  const inCanvas = nodeIdSet.has(`boss-${b.id}`)
                  return (
                    <div
                      key={b.id}
                      draggable={!inCanvas}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify({ entityType: 'BOSS', entityId: b.id, name: b.name, imagePath: b.imagePath }))
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => !inCanvas && addCharNode('BOSS', b)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition ${inCanvas ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-700'}`}
                    >
                      {b.imagePath
                        ? <img src={`/uploads/${b.imagePath}`} alt={b.name} className="w-6 h-6 object-cover rounded shrink-0" />
                        : <div className="w-6 h-6 bg-zinc-700 rounded flex items-center justify-center shrink-0">⚔️</div>
                      }
                      <span className={`truncate ${inCanvas ? 'text-gray-500' : 'text-gray-200'}`}>{b.name}</span>
                      {inCanvas && <span className="ml-auto text-gray-500">✓</span>}
                    </div>
                  )
                })}
              </>
            )}
            {npcs.length > 0 && (
              <>
                <p className="text-xs text-blue-400 font-semibold px-1 pt-2 pb-0.5">NPC</p>
                {npcs.map((n) => {
                  const inCanvas = nodeIdSet.has(`npc-${n.id}`)
                  return (
                    <div
                      key={n.id}
                      draggable={!inCanvas}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify({ entityType: 'NPC', entityId: n.id, name: n.name, imagePath: n.imagePath }))
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => !inCanvas && addCharNode('NPC', n)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition ${inCanvas ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-700'}`}
                    >
                      {n.imagePath
                        ? <img src={`/uploads/${n.imagePath}`} alt={n.name} className="w-6 h-6 object-cover rounded shrink-0" />
                        : <div className="w-6 h-6 bg-zinc-700 rounded flex items-center justify-center shrink-0">👤</div>
                      }
                      <span className={`truncate ${inCanvas ? 'text-gray-500' : 'text-gray-200'}`}>{n.name}</span>
                      {inCanvas && <span className="ml-auto text-gray-500">✓</span>}
                    </div>
                  )
                })}
              </>
            )}
            {bosses.length === 0 && npcs.length === 0 && (
              <p className="text-xs text-gray-500 px-2 pt-2">キャラクターがいません</p>
            )}
          </div>

          <div className="p-3 border-t border-zinc-700 space-y-2">
            {saveMsg && (
              <p className={`text-xs text-center ${saveMsg.includes('失敗') ? 'text-red-400' : 'text-green-400'}`}>
                {saveMsg}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white text-sm py-2 rounded font-medium transition"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* ---- キャンバス ---- */}
      <div className="flex-1 relative">
        {!admin && (
          <div className="absolute top-3 left-3 z-10">
            <Link
              to={`/games/${gameId}`}
              className="text-xs text-gray-300 bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-800 transition"
            >
              ← {game?.name ?? 'ゲーム詳細'}
            </Link>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={admin ? onNodesChange : undefined}
          onEdgesChange={admin ? onEdgesChange : undefined}
          onConnect={admin ? onConnect : undefined}
          onEdgeClick={admin ? onEdgeClick : undefined}
          onDrop={admin ? onDrop : undefined}
          onDragOver={admin ? onDragOver : undefined}
          onNodeContextMenu={admin ? onNodeContextMenu : undefined}
          onNodeDragStop={admin ? onNodeDragStop : undefined}
          nodeTypes={nodeTypes}
          nodesDraggable={admin}
          nodesConnectable={admin}
          elementsSelectable={admin}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-zinc-950"
        >
          <Background color="#3f3f46" gap={20} size={1} />
          <Controls style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 6 }} />
        </ReactFlow>

        {admin && (
          <div className="absolute bottom-4 right-4 z-10 text-xs text-gray-400 bg-zinc-900/90 border border-zinc-700 px-3 py-2 rounded space-y-0.5">
            <p>ノードの端をドラッグ → 関係線を引く</p>
            <p>エッジをクリック → ラベル変更 / 削除</p>
            <p>右クリック → 削除</p>
            <p>キャラを組織内にドラッグ → 所属</p>
          </div>
        )}
      </div>

      {/* ---- 組織追加ダイアログ ---- */}
      {showAddOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddOrg(false)}>
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gray-100 font-semibold mb-4">組織を追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">組織名</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="例: 円卓の騎士"
                  autoFocus
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
                  onKeyDown={(e) => { if (e.key === 'Enter') addOrgNode() }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">カラー</label>
                <div className="flex gap-2">
                  {ORG_COLORS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setOrgColorIdx(i)}
                      className="w-8 h-8 rounded-full border-2 transition"
                      style={{
                        backgroundColor: c.border,
                        borderColor: orgColorIdx === i ? '#fff' : 'transparent',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={addOrgNode}
                disabled={!orgName.trim()}
                className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white text-sm py-2 rounded font-medium transition"
              >
                追加
              </button>
              <button
                onClick={() => setShowAddOrg(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-gray-200 text-sm py-2 rounded transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- エッジ作成ダイアログ ---- */}
      {pendingConn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPendingConn(null)}>
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gray-100 font-semibold mb-4">関係性を選択</h3>
            <div className="space-y-2">
              {PRESET_LABELS.map((opt) => (
                <button key={opt.type} onClick={() => confirmEdge(opt.type, opt.label)}
                  className={`w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 ${opt.colorClass} font-semibold text-sm transition`}>
                  {opt.label}
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="その他（自由入力）" autoFocus
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
                  onKeyDown={(e) => { if (e.key === 'Enter' && customLabel) confirmEdge('CUSTOM', customLabel) }} />
                <button onClick={() => customLabel && confirmEdge('CUSTOM', customLabel)} disabled={!customLabel}
                  className="bg-zinc-600 hover:bg-zinc-500 disabled:opacity-40 text-gray-100 px-3 rounded text-sm transition">
                  追加
                </button>
              </div>
            </div>
            <button onClick={() => setPendingConn(null)} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-200 transition">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ---- エッジ編集ダイアログ ---- */}
      {editingEdgeId && editingEdge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditingEdgeId(null)}>
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gray-100 font-semibold mb-1">関係性を変更</h3>
            <p className="text-xs text-gray-400 mb-4">現在: <span className="text-gray-200">{editingEdge.label as string}</span></p>
            <div className="space-y-2">
              {PRESET_LABELS.map((opt) => (
                <button key={opt.type} onClick={() => updateEdgeLabel(opt.type, opt.label)}
                  className={`w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 ${opt.colorClass} font-semibold text-sm transition`}>
                  {opt.label}
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="その他（自由入力）"
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
                  onKeyDown={(e) => { if (e.key === 'Enter' && editLabel) updateEdgeLabel('CUSTOM', editLabel) }} />
                <button onClick={() => editLabel && updateEdgeLabel('CUSTOM', editLabel)} disabled={!editLabel}
                  className="bg-zinc-600 hover:bg-zinc-500 disabled:opacity-40 text-gray-100 px-3 rounded text-sm transition">
                  変更
                </button>
              </div>
            </div>
            <button onClick={deleteEdge} className="mt-3 w-full text-sm text-red-400 hover:text-red-300 py-2 border border-red-900/50 rounded transition">
              この関係を削除
            </button>
            <button onClick={() => setEditingEdgeId(null)} className="mt-2 w-full text-sm text-gray-400 hover:text-gray-200 transition">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RelationGraphPage() {
  return (
    <ReactFlowProvider>
      <RelationGraphEditor />
    </ReactFlowProvider>
  )
}
