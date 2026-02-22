import { useAtom } from "jotai"
import { appStateAtom, CNode, CNodeType, comicPageSortingAtom } from "../state"
import { useCreateComicPage } from "./useCreateComicPage"
import { useCreateComicImage } from "./useCreateComicImage"
import { useCreateText } from "./useCreateText"
import { useCreateBubble } from "./useCreateBubble"
import { placeholder } from "../constants"

export const useReflushLayer = (stageRef: any, appStateRef: any, deSelect: any) => {
  const [_, setAppState] = useAtom(appStateAtom)
  const [__, setComicPageSorting] = useAtom(comicPageSortingAtom)

  const createComicPage = useCreateComicPage()
  const createComicImage = useCreateComicImage()
  const createText = useCreateText(stageRef, appStateRef, deSelect)
  const createBubble = useCreateBubble()

  return async (layerRef: any, versionData: any) => {
    // Server side safety check
    if (typeof window === 'undefined') {
      return;
    }
    const { appState, comicPageSorting } = versionData
    layerRef?.destroyChildren()
    const stateIdMap: any = {}
    let sortedState = appState
    if (comicPageSorting && comicPageSorting.length) {
      appState.forEach((comicPage: CNode) => {
        stateIdMap[comicPage.attrs.id!] = comicPage
      })
      sortedState = comicPageSorting.map((id: string) => stateIdMap[id])
    }

    const newState = []
    for (let i = 0; i < sortedState.length; i++) {
      const cnode = sortedState[i]
      if (!cnode || cnode.visible === false) return
      let shape: any = null;
      console.log('cnode', cnode)
      if (cnode.cType == CNodeType.COMIC_PAGE) {
        shape = await createComicPage(cnode) as any
      } else if (cnode.cType == CNodeType.COMIC_IMAGE) { // image
        shape = await createComicImage(cnode)
      } else if (cnode.cType == CNodeType.COMIC_TEXT) { // text
        shape = await createText(cnode)
      } else if (cnode.cType == CNodeType.COMIC_BUBBLE) { // bubble
        shape = await createBubble(cnode) as any
      }
      if (shape) {
        layerRef.add(shape)
        newState.push(cnode)
      } else {
        console.error("Cannot create shape", cnode)
      }
    }
    layerRef.draw()
    setAppState(newState)
    setComicPageSorting([])
  }
}
