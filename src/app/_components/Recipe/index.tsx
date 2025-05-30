/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import PublicIcon from '@mui/icons-material/Public'
import PublicOffIcon from '@mui/icons-material/PublicOff'
import { Box, Grid, Skeleton, Stack, Tooltip } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import type {
  RecipeDifficulty as IRecipeDifficulty,
  Recipe,
  User,
} from '@prisma/client'
import { RecipeStatus } from '@prisma/client'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '~/trpc/react'
import { stringAvatar } from '../AppAvatar'
import ImageUploader from '../ImageUploader'
import RecipeActions from './RecipeActions'
import RecipeDescription from './RecipeDescription'
import RecipeDifficulty from './RecipeDifficulty'
import RecipeIngredients from './RecipeIngredients'
import RecipeMethod from './RecipeMethod'
import RecipeTime from './RecipeTime'
import RecipeTitle from './RecipeTitle'
import { useNotistack } from '~/app/_context/NotistackContext'

dayjs.extend(utc)
dayjs.extend(timezone)

export const RECIPE_SAMPLES_TH = {
  id: '1',
  createdBy: {
    id: '1',
    name: 'เชฟจอห์น',
  },
  title: '(ตัวอย่าง) ปาเอยากุ้งและไส้กรอกโชริโซ',
  date: '14 กันยายน 2016',
  image: 'https://mui.com/static/images/cards/paella.jpg',
  description:
    'ปาเอยาที่ดูน่าประทับใจนี้เหมาะสำหรับงานปาร์ตี้ และยังเป็นอาหารสนุก ๆ ที่สามารถทำไปพร้อมกับแขกได้อีกด้วย คุณสามารถเติมถั่วลันเตาแช่แข็ง 1 ถ้วยลงไปพร้อมกับหอยแมลงภู่หากต้องการ',
  ingredients: [
    { name: 'น้ำมันมะกอก', amount: '2 ช้อนโต๊ะ' },
    { name: 'สะโพกไก่', amount: '1 ปอนด์' },
    { name: 'กุ้ง', amount: '1 ปอนด์' },
    { name: 'ไส้กรอกโชริโซ', amount: '1/2 ปอนด์' },
    { name: 'พริกปาปริก้ารมควัน (Pimentón)', amount: '1 ช้อนชา' },
    { name: 'ใบกระวาน', amount: '2 ใบ' },
    { name: 'กระเทียม', amount: '4 กลีบ' },
    { name: 'มะเขือเทศกระป๋อง', amount: '1 กระป๋อง' },
    { name: 'หัวหอม', amount: '1 หัว' },
    { name: 'เกลือและพริกไทย', amount: '' },
    { name: 'เกสรหญ้าฝรั่น (Saffron)', amount: '1 หยิบมือ' },
    { name: 'น้ำซุปไก่', amount: '5 ถ้วย' },
    { name: 'ข้าว', amount: '2 ถ้วย' },
    { name: 'อาร์ติโช้ค', amount: '' },
    { name: 'พริกหยวกแดง', amount: '' },
    { name: 'หอยแมลงภู่', amount: '' },
  ],
  time: '30 นาที',
  difficulty: 'ปานกลาง',
  servings: '4 ที่',
  method:
    'อุ่นน้ำซุปไก่ 1/2 ถ้วยในหม้อจนร้อนแล้วเติมเกสรหญ้าฝรั่นลงไป จากนั้นพักไว้ 10 นาที\n\nตั้งน้ำมันในกระทะปาเอยาขนาด 14-16 นิ้ว หรือกระทะใบใหญ่ลึกบนไฟกลาง-แรง ใส่ไก่ กุ้ง และไส้กรอกลงไปผัดเป็นครั้งคราวจนสีเริ่มเหลืองทอง ใช้เวลาประมาณ 6-8 นาที นำกุ้งขึ้นพักไว้ โดยยังคงทิ้งไก่และไส้กรอกไว้ในกระทะ เติมพริกปาปริก้า ใบกระวาน กระเทียม มะเขือเทศ หัวหอม เกลือ และพริกไทย แล้วผัดจนข้นและหอม ใช้เวลาประมาณ 10 นาที เติมน้ำซุปหญ้าฝรั่นและน้ำซุปไก่ที่เหลือลงไป จากนั้นต้มจนเดือด\n\nใส่ข้าวลงไปและคนอย่างเบามือให้กระจายทั่วหน้า ใส่อาร์ติโช้คและพริกหยวกด้านบน และปรุงต่อโดยไม่ต้องคนจนของเหลวส่วนใหญ่ถูกดูดซึม ใช้เวลาประมาณ 15-18 นาที ลดไฟลงอ่อน-กลาง ใส่กุ้งและหอยแมลงภู่ที่พักไว้ โดยแทรกลงไปในข้าว แล้วปรุงต่อโดยไม่คนจนหอยแมลงภู่เปิดและข้าวสุกนุ่ม ใช้เวลาอีกประมาณ 5-7 นาที (ทิ้งหอยที่ไม่เปิด)\n\nนำลงจากเตาและพักไว้ 10 นาที แล้วจึงเสิร์ฟ',
}

export type Ingrediants = Record<
  string,
  {
    name: string
    amount: string
  }
>

export interface RecipeWithCreatedBy extends Recipe {
  createdBy: User
  ingredients: Ingrediants
  difficulty: IRecipeDifficulty
}

interface RecipeMainProps {
  userID: string
  recipeID: string
}

const RecipeSkeleton = memo(function RecipeSkeleton() {
  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <CardHeader
        avatar={
          // <Avatar {...stringAvatar('User')} aria-label="recipe" />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{
              marginRight: 2,
            }}
          />
        }
        title={
          <Typography
            variant="h6"
            color="text.secondary"
            fontSize="small">
            {' '}
            <Skeleton width={200} />{' '}
          </Typography>
        }
      />
      {/* <CardMedia
        loading="lazy"
        component="img"
        height="194"
        image="/images/recipe-placeholder.png"
        alt="image of the recipe"
      /> */}
      <Skeleton
        variant="rectangular"
        width={'100%'}
        height={194}
        sx={{
          marginBottom: 2,
        }}
      />
      <CardContent>
        <Skeleton
          variant="text"
          width={'100%'}
          height={50}
          sx={{
            marginBottom: 2,
          }}
        />
      </CardContent>
    </Card>
  )
})

export default memo(function Recipe(props: RecipeMainProps) {
  // navigation: Router
  const router = useRouter()

  // navigation: Searchparams
  const searchParams = useSearchParams()
  const QEditting = searchParams.get('editing')
  const isEditting = useMemo(() => {
    if (QEditting === 'true') {
      return true
    }
    return false
  }, [QEditting])

  // navigation: Path name
  const pathName = usePathname()

  const { showNotistack } = useNotistack()

  // State: Current Recipe Name
  const [currentRecipe, setCurrentRecipe] =
    useState<RecipeWithCreatedBy | null>(null)

  // State: file
  const [preparedFile, setPreparedFile] = useState<{
    file: File
    fileExtension: string
  } | null>(null)

  // trpc: get recipe by id
  const {
    data: recipe,
    refetch: refetchRecipe,
    isLoading: isRecipeLoading,
    isFetching: isRecipeFetching,
    error: recipeError,
  } = api.recipe.getById.useQuery(
    {
      recipeId: props.recipeID,
    },
    {
      enabled: Boolean(props.recipeID),
      refetchOnWindowFocus: false,
      retry: 1,
    },
  )
  // Effect: handle recipe error
  useEffect(() => {
    if (recipeError?.message === 'Unauthorized') {
      void router.push('/not-found')
    }
  }, [recipeError, router])

  // effect: set current recipe name
  useEffect(() => {
    if (recipe) {
      // Ensure ingredients is always of type Ingrediants and difficulty is not null
      setCurrentRecipe({
        ...recipe,
        ingredients:
          recipe.ingredients &&
          typeof recipe.ingredients === 'object'
            ? (recipe.ingredients as Ingrediants)
            : {},
        difficulty: recipe.difficulty ?? {
          // fallback to a default difficulty object if null
          id: '',
          name: '',
          createdById: null,
          index: 0,
        },
      })
    }
  }, [recipe])

  // TRPC: delete recipe name
  const {
    mutateAsync: deleteRecipe,
    isPending: isDeleteRecipePending,
  } = api.recipe.delete.useMutation({
    onSuccess: () => {
      console.log('Delete recipe draft success')
    },
    onError: (error) => {
      console.error('Delete recipe draft error', error)
    },
  })

  // trpc: update recipe name
  const updateRecipe = api.recipe.update.useMutation({
    onSuccess: () => {
      console.log('Recipe name updated successfully')

      // void refetchRecipe().then(() => {
      //   void router.push(pathName, {
      //     scroll: true,
      //   })
      // })
      void refetchRecipe().then(() => {
        void showNotistack('บันทึกฉบับร่างแล้ว', 'success')
      })
    },
    onError: (error) => {
      console.error('Error updating recipe name:', error)
    },
  })

  // Callback: delete recipe name
  const handleDeleteRecipeDraft = useCallback(async () => {
    try {
      const windowConfirm = window.confirm(
        'คุณต้องการลบสูตรอาหารนี้หรือไม่?',
      )
      if (!windowConfirm) {
        return
      }

      await deleteRecipe({ recipeId: props.recipeID })
      console.log('Recipe draft deleted successfully')
    } catch (error) {
      console.error('Error deleting recipe draft:', error)
    }
  }, [deleteRecipe, props.recipeID])

  const handleUpload = useCallback(
    async (fileObj: { file: File; fileExtension: string }) => {
      if (!currentRecipe) {
        console.error('No current recipe to upload file to')
        return
      }

      const formData = new FormData()
      formData.append('file', fileObj.file)
      formData.append('recipeId', currentRecipe?.id)
      formData.append('fileExtension', fileObj.fileExtension)

      await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      }).then((response) => {
        if (response.ok) {
          console.log('File uploaded successfully')
          setPreparedFile(null)
          // Update the current recipe with the new image
          setCurrentRecipe((prev) => {
            if (prev) {
              return {
                ...prev,
                image: `${currentRecipe.id}.${fileObj.fileExtension}`,
              }
            }
            return null
          })
        } else {
          console.error('Error uploading file:', response.statusText)
        }
      })
    },
    [currentRecipe],
  )

  // Callback: handleSave
  const handleSave = useCallback(async () => {
    if (currentRecipe) {
      debugger

      if (preparedFile) {
        await handleUpload(preparedFile)
      }

      await updateRecipe.mutateAsync({
        id: currentRecipe.id,
        name: currentRecipe.name,
        description: currentRecipe.description ?? '',
        ingredients: currentRecipe.ingredients ?? {
          ingredient: [],
        },
        time: currentRecipe.time ?? '',
        difficultyId: currentRecipe.difficultyId ?? '',
        servings: currentRecipe.servings ?? '',
        method: currentRecipe.method ?? '',
      })
    }
  }, [currentRecipe, handleUpload, preparedFile, updateRecipe])

  // Callback: handleCancel
  const handleCancel = useCallback(() => {
    // Reset the current recipe name to the original value
    setCurrentRecipe((prev) => {
      if (prev) {
        return {
          ...prev,
          name: recipe?.name || '',
        }
      }
      return null
    })

    void router.push(pathName, {
      scroll: false,
    })
  }, [pathName, recipe?.name, router])

  // Memo: isRecipeLoading
  const isLoading = useMemo(() => {
    if (isRecipeLoading || isRecipeFetching) {
      return true
    }
    return false
  }, [isRecipeLoading, isRecipeFetching])

  // Memo: image URL
  const imageURL = useMemo(() => {
    if (currentRecipe?.image) {
      return currentRecipe?.image
    }
    return null
  }, [currentRecipe?.image])

  // Memo: isPublished
  const isPublished = useMemo(() => {
    if (!currentRecipe) return false

    return currentRecipe.status === RecipeStatus.PUBLISHED
  }, [currentRecipe])

  return (
    <>
      {isLoading ? (
        <RecipeSkeleton />
      ) : (
        <Card>
          <CardHeader
            avatar={
              <Avatar
                {...stringAvatar(
                  currentRecipe?.createdBy?.name || 'User',
                )}
                aria-label="recipe"
              />
            }
            action={
              <>
                {currentRecipe && (
                  <RecipeActions
                    handleDeleteRecipeDraft={handleDeleteRecipeDraft}
                    handleSave={handleSave}
                    handleCancel={handleCancel}
                    isDeleteRecipeDraftPending={
                      isDeleteRecipePending
                    }
                    isEditting={isEditting}
                    currentRecipe={currentRecipe}
                    refetchRecipe={refetchRecipe}
                    isSaving={updateRecipe?.isPending}
                  />
                )}
              </>
            }
            title={
              <RecipeTitle
                currentRecipe={currentRecipe}
                setCurrentRecipe={setCurrentRecipe}
                isEditting={isEditting}
                handleSave={handleSave}
                handleCancel={handleCancel}
              />
            }
            subheader={
              <Stack
                direction="row"
                spacing={1}
                alignItems={'center'}>
                {isPublished ? (
                  <Tooltip title="เผยแพร่แล้ว">
                    <PublicIcon
                      sx={{
                        color: 'text.secondary',
                        fontSize: 'small',
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="ฉบับร่าง">
                    <PublicOffIcon
                      sx={{
                        color: 'text.secondary',
                        fontSize: 'small',
                      }}
                    />
                  </Tooltip>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="small">
                  {`${
                    currentRecipe?.createdAt
                      ? `สร้างเมื่อ: ${dayjs(currentRecipe.createdAt)
                          .tz('Asia/Bangkok')
                          .format('DD/MM/YYYY HH:mm:ss')}`
                      : 'สร้างเมื่อ: '
                  }`}
                </Typography>
              </Stack>
            }
          />
          {imageURL && (
            <CardMedia
              id="recipe-image"
              loading="lazy"
              component="img"
              height="300"
              image={imageURL || ''}
              alt="image of the recipe"
              // sx={{
              //   objectFit: 'cover',
              //   padding: 2,
              // }}
            />
          )}

          {isEditting && (
            <Box
              sx={{
                paddingTop: 2,
                paddingBottom: 2,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              height="194">
              <ImageUploader
                preparedFile={preparedFile}
                setPreparedFile={setPreparedFile}
                // handleUpload={handleUpload}
              />
            </Box>
          )}
          <CardContent>
            <Typography
              sx={{
                fontWeight: 'bold',
                marginBottom: 1,
              }}>
              คำอธิบาย:
            </Typography>
            <RecipeDescription
              currentRecipe={currentRecipe}
              setCurrentRecipe={setCurrentRecipe}
              isEditting={isEditting}
              handleSave={handleSave}
              handleCancel={handleCancel}
            />
          </CardContent>

          <CardContent>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 1,
                  }}>
                  ระยะเวลา:
                </Typography>
                <RecipeTime
                  currentRecipe={currentRecipe}
                  setCurrentRecipe={setCurrentRecipe}
                  isEditting={isEditting}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                />
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 1,
                  }}>
                  ความยาก:
                </Typography>
                <RecipeDifficulty
                  currentRecipe={currentRecipe}
                  setCurrentRecipe={setCurrentRecipe}
                  isEditting={isEditting}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                />
              </Grid>
              <Grid size={6}>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 1,
                  }}>
                  วัตถุดิบ:
                </Typography>
                <RecipeIngredients
                  currentRecipe={currentRecipe}
                  setCurrentRecipe={setCurrentRecipe}
                  isEditting={isEditting}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                />
              </Grid>
            </Grid>
          </CardContent>

          <CardContent>
            <Typography
              sx={{
                fontWeight: 'bold',
                marginBottom: 1,
              }}>
              วิธีทำ:
            </Typography>
            <RecipeMethod
              currentRecipe={currentRecipe}
              setCurrentRecipe={setCurrentRecipe}
              isEditting={isEditting}
              handleSave={handleSave}
              handleCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
})
