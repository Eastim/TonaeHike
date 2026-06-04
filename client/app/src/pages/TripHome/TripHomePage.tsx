import { useState, useEffect } from 'react'
import { CalendarDays, ChevronRight, Clock3, MapPinned, Plus, Upload, X, ArrowRight, Trash2, FileText, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreateTripModal } from '../../components/CreateTripModal/CreateTripModal'
import { useTripStore } from '../../stores/tripStore'
import { Header } from '../../components/Header/Header'
import { TabBar } from '../../components/TabBar/TabBar'
import { ShowSuccessModal } from '../../components/showSuccessModal/showSuccessmodal'
import type { TripPlan } from '../../types'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

export function TripHomePage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<TripPlan | null>(null)
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<TripPlan | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [exportMode, setExportMode] = useState(false)
  const [planToExport, setPlanToExport] = useState<TripPlan | null>(null)
  const plans = useTripStore((state) => state.plans)
  const loading = useTripStore((state) => state.loading)
  const createPlan = useTripStore((state) => state.createPlan)
  const selectPlan = useTripStore((state) => state.selectPlan)
  const loadPlans = useTripStore((state) => state.loadPlans)
  const removePlan = useTripStore((state) => state.removePlan)

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  // 删除行程计划
  const handleDeletePlan = async () => {
    if (!deleteConfirmPlan) return

    try {
      const response = await fetch(`http://localhost:3000/api/trips/${deleteConfirmPlan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // 更新本地计划列表
        removePlan(deleteConfirmPlan.id)
        // 如果当前打开的是被删除的计划，关闭模态框
        if (selectedPlan && selectedPlan.id === deleteConfirmPlan.id) {
          setSelectedPlan(null)
        }
        setDeleteConfirmPlan(null)
        // 显示删除成功弹窗
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
      } else {
        alert('删除失败，请稍后重试')
        setDeleteConfirmPlan(null)
      }
    } catch (error) {
      console.error('删除行程计划失败:', error)
      alert('删除失败，请稍后重试')
      setDeleteConfirmPlan(null)
    }
  }

  const openPlan = (planId: string) => {
    selectPlan(planId)
    navigate('/trip-planner')
  }

  const handlePlanClick = (plan: TripPlan) => {
    setSelectedPlan(plan)
  }

  const handleClosePlanModal = () => {
    setSelectedPlan(null)
  }

  const handleEnterPlan = () => {
    if (selectedPlan) {
      openPlan(selectedPlan.id)
    }
  }

  // 导出相关函数
  const handleExportClick = () => {
    setExportMode(true)
  }

  const handlePlanSelectForExport = (plan: TripPlan) => {
    setPlanToExport(plan)
    setExportMode(false)
  }

  const cancelExport = () => {
    setExportMode(false)
    setPlanToExport(null)
  }

  // 导出为 TXT
  const exportToTxt = (plan: TripPlan) => {
    let content = `${plan.name}\n`
    content += `${'='.repeat(plan.name.length)}\n\n`
    content += `目的地: ${plan.destination}\n`
    content += `出行日期: ${plan.startDate} ~ ${plan.endDate}\n`
    content += `行程天数: ${plan.days.length} 天\n\n`

    plan.days.forEach((day) => {
      content += `${day.label}\n`
      content += `${'-'.repeat(day.label.length)}\n`
      
      if (day.spots.length === 0) {
        content += `  暂无景点\n`
      } else {
        day.spots.forEach((spot, index) => {
          content += `  ${index + 1}. ${spot.name}\n`
          if (spot.address) {
            content += `     地址: ${spot.address}\n`
          }
          content += '\n'
        })
      }
      content += '\n'
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${plan.name}.txt`)
    setPlanToExport(null)
  }

  // 导出为 DOCX
  const exportToDocx = (plan: TripPlan) => {
    const children: any[] = []
    
    // 标题
    children.push(
      new Paragraph({
        text: plan.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )

    // 基本信息
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '目的地: ', bold: true }),
          new TextRun(plan.destination),
        ],
        spacing: { after: 100 },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '出行日期: ', bold: true }),
          new TextRun(`${plan.startDate} ~ ${plan.endDate}`),
        ],
        spacing: { after: 100 },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '行程天数: ', bold: true }),
          new TextRun(`${plan.days.length} 天`),
        ],
        spacing: { after: 200 },
      })
    )

    // 每天的行程
    plan.days.forEach((day) => {
      children.push(
        new Paragraph({
          text: day.label,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      )

      if (day.spots.length === 0) {
        children.push(
          new Paragraph({
            text: '暂无景点',
            spacing: { after: 100 },
          })
        )
      } else {
        day.spots.forEach((spot, index) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${spot.name}`, bold: true }),
              ],
              spacing: { after: 50 },
            })
          )

          if (spot.address) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '   地址: ' }),
                  new TextRun(spot.address),
                ],
                spacing: { after: 100 },
              })
            )
          }
        })
      }
    })

    const doc = new Document({ sections: [{ children }] })

    Packer.toBlob(doc).then((blob: Blob) => {
      saveAs(blob, `${plan.name}.docx`)
    })

    setPlanToExport(null)
  }

  // 导出为 PDF - 使用html2canvas截图方式支持中文
  const exportToPdf = async (plan: TripPlan) => {
    // 创建临时容器
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    container.style.backgroundColor = '#ffffff'
    container.style.padding = '40px'
    container.style.fontFamily = 'Microsoft YaHei, SimHei, sans-serif'
    document.body.appendChild(container)

    // 生成HTML内容
    let htmlContent = `
      <div style="color: #1e293b;">
        <h1 style="font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 30px; color: #0f172a;">${plan.name}</h1>
        
        <div style="margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 12px;">
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; color: #64748b;">目的地：</span>
            <span style="color: #1e293b;">${plan.destination}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; color: #64748b;">出行日期：</span>
            <span style="color: #1e293b;">${plan.startDate} ~ ${plan.endDate}</span>
          </div>
          <div>
            <span style="font-weight: bold; color: #64748b;">行程天数：</span>
            <span style="color: #1e293b;">${plan.days.length} 天</span>
          </div>
        </div>
    `

    plan.days.forEach((day) => {
      htmlContent += `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #0891b2; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">${day.label}</h2>
      `

      if (day.spots.length === 0) {
        htmlContent += `<div style="color: #94a3b8; padding-left: 20px;">暂无景点</div>`
      } else {
        day.spots.forEach((spot, index) => {
          htmlContent += `
            <div style="margin-bottom: 15px; padding: 15px; background: #f1f5f9; border-radius: 8px; margin-left: 20px;">
              <div style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">${index + 1}. ${spot.name}</div>
              ${spot.address ? `<div style="color: #64748b; font-size: 14px;">地址：${spot.address}</div>` : ''}
            </div>
          `
        })
      }
      htmlContent += `</div>`
    })

    htmlContent += `</div>`
    container.innerHTML = htmlContent

    try {
      // 等待一帧确保渲染完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgWidth = 210 // A4宽度 mm
      const pageHeight = 297 // A4高度 mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // 添加图片到PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // 如果内容超过一页，添加更多页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${plan.name}.pdf`)
    } catch (error) {
      console.error('PDF导出失败:', error)
      alert('PDF导出失败，请重试')
    } finally {
      // 清理临时容器
      document.body.removeChild(container)
    }

    setPlanToExport(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <Header />
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1440px] flex-col gap-8 px-6 py-8">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">我的行程</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {exportMode ? (
              <button
                type="button"
                onClick={cancelExport}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-600"
              >
                <X className="h-4 w-4" />
                取消导出
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExportClick}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-600"
              >
                <Upload className="h-4 w-4" />
                导出行程
              </button>
            )}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4" />
              创建行程
            </button>
          </div>
        </header>

        {loading ? (
          <section className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="text-slate-500">加载中...</span>
            </div>
          </section>
        ) : plans.length === 0 ? (
          <section className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
            <div className="max-w-[560px]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <MapPinned className="h-9 w-9" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-slate-900">创建你的第一个行程</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                创建完成后即可进入按天规划页面，后续这里会展示你保存的全部行程。
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <motion.button
                key={plan.id}
                type="button"
                onClick={() => exportMode ? handlePlanSelectForExport(plan) : handlePlanClick(plan)}
                animate={exportMode ? {
                  y: [0, -10, 0, 10, 0],
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 1px 3px rgba(0,0,0,0.12)',
                    '0 10px 30px rgba(6,182,212,0.3)',
                    '0 1px 3px rgba(0,0,0,0.12)',
                    '0 10px 30px rgba(6,182,212,0.3)',
                    '0 1px 3px rgba(0,0,0,0.12)'
                  ]
                } : {}}
                transition={exportMode ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                } : {}}
                className={`group relative rounded-2xl border bg-white p-6 text-left shadow-sm transition ${
                  exportMode 
                    ? 'border-cyan-400 cursor-pointer hover:border-cyan-500 hover:shadow-lg hover:scale-[1.02]' 
                    : 'border-slate-200 hover:border-cyan-300 hover:shadow-md'
                }`}
              >
                {/* 删除按钮 */}
                {!exportMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmPlan(plan)
                    }}
                    className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 rounded-full flex items-center justify-center transition-all hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                
                {exportMode && (
                  <div className="absolute top-4 right-4">
                    <Upload className="h-5 w-5 text-cyan-500" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">行程</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">{plan.name}</h2>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-cyan-500" />
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                  <MapPinned className="h-4 w-4 text-cyan-500" />
                  {plan.destination}
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-cyan-500" />
                  <span>{plan.startDate} ~ {plan.endDate}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>共 {plan.days.length} 天</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(plan.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </motion.button>
            ))}
          </section>
        )}
      </div>

      <CreateTripModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          createPlan(payload)
          setCreateOpen(false)
          navigate('/trip-planner')
        }}
      />

      <AnimatePresence>
        {selectedPlan && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePlanModal}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[600px] bg-white rounded-2xl overflow-hidden z-50 shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="absolute top-5 right-5 w-10 h-10 bg-slate-100/80 backdrop-blur-[10px] border border-slate-200/50 rounded-full text-slate-600 cursor-pointer flex items-center justify-center z-10 transition-all duration-300 hover:bg-slate-200/80 hover:border-slate-300/50 hover:scale-105"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleClosePlanModal}
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="p-8">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">行程预览</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">{selectedPlan.name}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                      <MapPinned className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">目的地</p>
                      <p className="text-base font-medium text-slate-900">{selectedPlan.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                      <CalendarDays className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">出行日期</p>
                      <p className="text-base font-medium text-slate-900">
                        {selectedPlan.startDate} ~ {selectedPlan.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                      <Clock3 className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">行程天数</p>
                      <p className="text-base font-medium text-slate-900">共 {selectedPlan.days.length} 天</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-xs text-slate-500 mb-2">已规划景点</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.days.map((day) => (
                        <div key={day.index} className="text-sm text-slate-600">
                          {day.label}: {day.spots.length} 个景点
                        </div>
                      ))}
                    </div>
                    {selectedPlan.days.every(day => day.spots.length === 0) && (
                      <p className="text-sm text-slate-400">暂无景点</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-xs text-slate-500">最后更新</p>
                      <p className="text-sm text-slate-600">
                        {new Date(selectedPlan.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnterPlan}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4 text-base font-medium text-white transition hover:from-cyan-600 hover:to-cyan-700 hover:shadow-lg"
                >
                  进入行程详情
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteConfirmPlan && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirmPlan(null)}
          >
            <motion.div
              className="w-[90%] max-w-[420px] bg-white rounded-2xl p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">确认删除</h3>
                <p className="mt-2 text-gray-500">确定要删除这个行程计划吗？此操作不可撤销！</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmPlan(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeletePlan}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导出选项弹窗 */}
      <AnimatePresence>
        {planToExport && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelExport}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white rounded-2xl overflow-hidden z-50 shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="absolute top-5 right-5 w-10 h-10 bg-slate-100/80 backdrop-blur-[10px] border border-slate-200/50 rounded-full text-slate-600 cursor-pointer flex items-center justify-center z-10 transition-all duration-300 hover:bg-slate-200/80 hover:border-slate-300/50 hover:scale-105"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={cancelExport}
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="p-8">
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-cyan-500" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">导出格式</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{planToExport.name}</h2>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => exportToPdf(planToExport)}
                    className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500 group-hover:bg-red-200 transition">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">导出为 PDF</h3>
                      <p className="text-sm text-slate-500">生成格式化的 PDF 文档</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToTxt(planToExport)}
                    className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">导出为 TXT</h3>
                      <p className="text-sm text-slate-500">生成纯文本文件</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToDocx(planToExport)}
                    className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition">
                      <FileDown className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">导出为 DOCX</h3>
                      <p className="text-sm text-slate-500">生成 Microsoft Word 文档</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 transition" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 成功弹窗 */}
      <ShowSuccessModal show={showSuccessModal} message="删除成功" />

      <TabBar hidden={!!selectedPlan || exportMode || !!planToExport} />
    </div>
  )
}
